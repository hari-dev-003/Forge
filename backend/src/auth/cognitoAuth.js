// Amazon Cognito auth provider.
//   login()               -> AdminInitiateAuth (ADMIN_USER_PASSWORD_AUTH). Returns
//                             either { user, token } or, if the account still has a
//                             temporary password, { challenge: 'NEW_PASSWORD_REQUIRED',
//                             session, email } for the frontend to complete via
//                             completeNewPassword() below.
//   completeNewPassword() -> AdminRespondToAuthChallenge for NEW_PASSWORD_REQUIRED —
//                             finishes a first login that started with a temporary
//                             password (see adminCreateUser's `permanent: false`).
//   verify()              -> cryptographic JWT verification via aws-jwt-verify (JWKS)
//   adminCreateUser()     -> AdminCreateUser + set password (permanent or temporary)
//                             + add to role group, then persist the app profile in
//                             DynamoDB. Used for both Admin-creates-Manager (permanent
//                             password, no forced change) and Manager-creates-User
//                             (temporary password, forced change on first login).
//   ensureGroup()         -> idempotent group creation (used by the bootstrap script)
//
// Cognito is the identity source of truth; app-specific fields (managerId,
// city) live in the DynamoDB user record keyed by the Cognito `sub`.
import crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  CreateGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { SimpleJwksCache } from 'aws-jwt-verify/jwk';
import { SimpleJsonFetcher } from 'aws-jwt-verify/https';
import { env, awsClientConfig } from '../config/env.js';
import { userRepo } from '../repositories/userRepo.js';
import { ROLES } from '../config/constants.js';
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const client = new CognitoIdentityProviderClient(awsClientConfig(env.cognito.region));

const GROUP_FOR_ROLE = { ADMIN: 'Admin', MANAGER: 'Manager', USER: 'User' };
const roleFromGroups = (groups = []) =>
  groups.includes('Admin') ? ROLES.ADMIN : groups.includes('Manager') ? ROLES.MANAGER : ROLES.USER;

// aws-jwt-verify's default JWKS fetch timeout (1.5s) is tighter than this
// environment's observed latency to Cognito's .well-known/jwks.json, which
// intermittently made otherwise-valid logins fail with "Invalid or expired
// token". Widen it and prime the cache at import time so the first real
// login never pays the cold-fetch penalty.
let _verifier = null;
function verifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create(
      {
        userPoolId: env.cognito.userPoolId,
        tokenUse: 'id',
        clientId: env.cognito.clientId,
      },
      {
        jwksCache: new SimpleJwksCache({
          fetcher: new SimpleJsonFetcher({ defaultRequestOptions: { responseTimeout: 10000 } }),
        }),
      }
    );
    _verifier.hydrate().catch((e) => logger.warn('Cognito JWKS pre-fetch failed (will retry on first verify)', { message: e.message }));
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

// This user pool has `email` as an alias attribute, so Cognito rejects an
// email-format Username at account-creation time (AliasExistsException-
// adjacent InvalidParameterException) — adminCreateUser() needs a sanitized
// Username. Sign-in still works via the email alias in login() below.
function sanitizeUsername(email) {
  return email.replace(/@/g, '_at_').replace(/[^a-zA-Z0-9_.-]/g, '_');
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
      if (res.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        // First login on a temporary password (Manager-created User) — the
        // frontend collects a new password and finishes via completeNewPassword().
        return { challenge: 'NEW_PASSWORD_REQUIRED', session: res.Session, email };
      }
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

  /** Finish a first login that started with a temporary password. */
  async completeNewPassword({ email, newPassword, session }) {
    if (!email || !newPassword || !session) {
      throw new BadRequestError('email, newPassword and session are required');
    }

    let res;
    try {
      const hash = secretHash(email);
      res = await client.send(
        new AdminRespondToAuthChallengeCommand({
          UserPoolId: env.cognito.userPoolId,
          ClientId: env.cognito.clientId,
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          Session: session,
          ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
            ...(hash ? { SECRET_HASH: hash } : {}),
          },
        })
      );
    } catch (e) {
      if (e.name === 'InvalidPasswordException') {
        throw new BadRequestError(`Password does not meet requirements: ${e.message}`);
      }
      if (e.name === 'NotAuthorizedException' || e.name === 'ExpiredCodeException') {
        throw new UnauthorizedError('That session has expired — please sign in again');
      }
      throw e;
    }

    const token = res.AuthenticationResult?.IdToken;
    if (!token) throw new UnauthorizedError('Failed to complete the password change');

    const principal = await cognitoAuth.verify(token);
    const profile = (await userRepo.getById(principal.id)) || principal;
    return { user: profile, token };
  },

  async verify(token) {
    let payload;
    try {
      payload = await verifier().verify(token);
    } catch (e) {
      logger.warn('Token verification failed', { name: e.name, message: e.message });
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
      city: profile.city ?? null,
    };
  },

  /** Admin/manager-provision a user: create in Cognito, set a password (permanent
   *  or temporary — forcing a change on first login), add to the role group,
   *  and persist the app profile in DynamoDB. */
  async adminCreateUser({
    email,
    password,
    name,
    role = ROLES.USER,
    managerId = null,
    city = null,
    userId = null,
    active = true,
    permanent = true,
  }) {
    if (!email || !password) throw new BadRequestError('email and password are required');

    const cognitoUsername = sanitizeUsername(email);

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
            // This pool's schema requires preferred_username to be complete
            // before Cognito will finalize a NEW_PASSWORD_REQUIRED challenge
            // (AdminRespondToAuthChallenge otherwise fails with
            // "Invalid attributes given, preferred_username is missing") —
            // set it here so a temporary-password (permanent:false) account
            // never hits that at first-login time.
            { Name: 'preferred_username', Value: cognitoUsername },
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
          Permanent: permanent,
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
        city,
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
