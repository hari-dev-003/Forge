// One-time bootstrap for a fresh deployment. Requires real AWS resources +
// credentials (Cognito user pool, DynamoDB table). Idempotent — safe to re-run.
//
//   1. Ensures the Admin / Manager / User Cognito groups exist
//   2. Writes the default points rules to DynamoDB
//   3. Creates the first Admin user (Cognito + DynamoDB profile)
//
// Run:  BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD set in .env, then
//   npm run bootstrap
import { env, validateEnv } from '../config/env.js';
import { cognitoAuth } from '../auth/cognitoAuth.js';
import { configRepo } from '../repositories/configRepo.js';
import { DEFAULT_POINTS_RULES, ROLES } from '../config/constants.js';
import { logger } from '../lib/logger.js';

async function main() {
  validateEnv({ requireBootstrapAdmin: true });

  logger.info('Ensuring Cognito groups exist (Admin, Manager, User)…');
  for (const group of ['Admin', 'Manager', 'User']) {
    await cognitoAuth.ensureGroup(group);
  }

  logger.info('Writing default points rules to DynamoDB…');
  await configRepo.setPointsRules(DEFAULT_POINTS_RULES);

  logger.info(`Creating admin user ${env.bootstrapAdmin.email}…`);
  try {
    const { user } = await cognitoAuth.adminCreateUser({
      email: env.bootstrapAdmin.email,
      password: env.bootstrapAdmin.password,
      name: env.bootstrapAdmin.name,
      role: ROLES.ADMIN,
    });
    logger.info(`Admin created: ${user.email} (id ${user.id})`);
  } catch (e) {
    if (e.code === 'CONFLICT') {
      logger.info('Admin already exists in Cognito — skipping creation.');
    } else {
      throw e;
    }
  }

  logger.info('Bootstrap complete. Sign in with the admin credentials from your .env.');
  process.exit(0);
}

main().catch((e) => {
  logger.error('Bootstrap failed', { message: e.message, stack: e.stack });
  process.exit(1);
});
