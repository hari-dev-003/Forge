// Amazon Cognito auth provider.
//   login()          -> AdminInitiateAuth (ADMIN_USER_PASSWORD_AUTH), returns the ID token
//   verify()         -> cryptographic JWT verification via aws-jwt-verify (JWKS)
//   adminCreateUser()-> AdminCreateUser + set permanent password + add to role group,
//                       then persist the app profile (manager/region) in DynamoDB
//   ensureGroup()    -> idempotent group creation (used by the bootstrap script)
//
// Cognito is the identity source of truth; app-specific fields (managerId,
// region) live in the DynamoDB user record keyed by the Cognito `sub`.
import crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  CreateGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env, awsClientConfig } from '../config/env.js';
import { userRepo } from '../repositories/userRepo.js';
import { ROLES } from '../config/constants.js';
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from '../lib/errors.js';

const client = new CognitoIdentityProviderClient(awsClientConfig(env.cognito.region));

const GROUP_FOR_ROLE = { ADMIN: 'Admin', MANAGER: 'Manager', USER: 'User' };
const roleFromGroups = (groups = []) =>
  groups.includes('Admin') ? ROLES.ADMIN : groups.includes('Manager') ? ROLES.MANAGER : ROLES.USER;

let _verifier = null;
function verifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId: env.cognito.userPoolId,
      tokenUse: 'id',
      clientId: env.cognito.clientId,
    });
  }
  return _verifier;
}

// Required only when the app client has a secret configured.
function secretHash(username) {
  if (!env.cognito.clientSecret) return undefined;
  return crypto
    .createHmac('sha256', env.cognito.clientSecret)
    .update(username + env.cognito.clientId)
    .digest('base64');
}

export const cognitoAuth = {
  async login({ email, password }) {
    if (!email || !password) throw new BadRequestError('email and password are required');

    let res;
    try {
      const hash = secretHash(email);
      res = await client.send(
        new AdminInitiateAuthCommand({
          UserPoolId: env.cognito.userPoolId,
          ClientId: env.cognito.clientId,
          AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            ...(hash ? { SECRET_HASH: hash } : {}),
          },
        })
      );
    } catch (e) {
      if (e.name === 'NotAuthorizedException' || e.name === 'UserNotFoundException') {
        throw new UnauthorizedError('Invalid credentials');
      }
      if (e.name === 'UserNotConfirmedException') throw new UnauthorizedError('Account is not confirmed');
      throw e;
    }

    if (res.ChallengeName) {
      // e.g. NEW_PASSWORD_REQUIRED — handle via Hosted UI or a challenge flow if enabled.
      throw new UnauthorizedError(`Authentication challenge required: ${res.ChallengeName}`);
    }
    const token = res.AuthenticationResult?.IdToken;
    if (!token) throw new UnauthorizedError('Login failed');

    const principal = await cognitoAuth.verify(token);
    const profile = (await userRepo.getById(principal.id)) || principal;
    if (profile.active === false) {
      throw new ForbiddenError('Your account is pending admin approval');
    }
    return { user: profile, token };
  },

  async verify(token) {
    let payload;
    try {
      payload = await verifier().verify(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
    const role = roleFromGroups(payload['cognito:groups']);
    const profile = (await userRepo.getById(payload.sub)) || {};
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || profile.name,
      role,
      managerId: profile.managerId ?? null,
      region: profile.region ?? null,
    };
  },

  /** Admin-provision a user: create in Cognito, set a permanent password, add to
   *  the role group, and persist the app profile in DynamoDB. */
  async adminCreateUser({
    email,
    password,
    name,
    role = ROLES.USER,
    managerId = null,
    region = null,
    userId = null,
    active = true,
  }) {
    if (!email || !password) throw new BadRequestError('email and password are required');

    // This user pool has `email` as an alias attribute, so Cognito rejects an
    // email-format Username at creation time (AliasExistsException-adjacent
    // InvalidParameterException). Use a sanitized Username instead — sign-in
    // still works via the email alias in login() below.
    const cognitoUsername = email.replace(/@/g, '_at_').replace(/[^a-zA-Z0-9_.-]/g, '_');

    let created;
    try {
      created = await client.send(
        new AdminCreateUserCommand({
          UserPoolId: env.cognito.userPoolId,
          Username: cognitoUsername,
          MessageAction: 'SUPPRESS', // no invite email — we set the password directly
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: name || email },
          ],
        })
      );
    } catch (e) {
      if (e.name === 'UsernameExistsException') {
        throw new ConflictError('A user with this email already exists');
      }
      throw e;
    }

    const sub = created.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;

    // From here on, roll back the Cognito user on any failure so a retry with
    // the same email doesn't hit a stale, half-provisioned account (409).
    try {
      await client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: env.cognito.userPoolId,
          Username: cognitoUsername,
          Password: password,
          Permanent: true,
        })
      );

      await client.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: env.cognito.userPoolId,
          Username: cognitoUsername,
          GroupName: GROUP_FOR_ROLE[role] || 'User',
        })
      );

      const user = {
        id: sub,
        email: email.toLowerCase(),
        name: name || email,
        role,
        managerId,
        region,
        userId,
        active,
        createdAt: new Date().toISOString(),
      };
      await userRepo.create(user);
      return { user };
    } catch (e) {
      await client
        .send(new AdminDeleteUserCommand({ UserPoolId: env.cognito.userPoolId, Username: cognitoUsername }))
        .catch(() => {});
      if (e.name === 'InvalidPasswordException') {
        throw new BadRequestError(`Password does not meet requirements: ${e.message}`);
      }
      throw e;
    }
  },

  /** Idempotently ensure a Cognito group exists (bootstrap helper). */
  async ensureGroup(name) {
    try {
      await client.send(new CreateGroupCommand({ UserPoolId: env.cognito.userPoolId, GroupName: name }));
    } catch (e) {
      if (e.name !== 'GroupExistsException') throw e;
    }
  },
};

export default cognitoAuth;
