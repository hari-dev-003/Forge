import dotenv from 'dotenv';

dotenv.config();

function get(key, { def = undefined } = {}) {
  const val = process.env[key];
  return val === undefined || val === '' ? def : val;
}

export const env = {
  nodeEnv: get('NODE_ENV', { def: 'development' }),
  isProd: get('NODE_ENV', { def: 'development' }) === 'production',
  port: Number(get('PORT', { def: '4000' })),
  apiPrefix: get('API_PREFIX', { def: '/api' }),
  corsOrigin: get('CORS_ORIGIN', { def: '*' }),

  // AWS
  awsRegion: get('AWS_REGION', { def: 'ap-south-1' }),
  ddbTableName: get('DDB_TABLE_NAME', { def: 'Forge' }),

  // S3
  s3Bucket: get('S3_BUCKET'),
  s3PresignExpires: Number(get('S3_PRESIGN_EXPIRES', { def: '300' })), // upload PUT window
  s3ViewExpires: Number(get('S3_VIEW_EXPIRES', { def: '3600' })), // photo GET view window

  // Cognito
  cognito: {
    userPoolId: get('COGNITO_USER_POOL_ID'),
    clientId: get('COGNITO_CLIENT_ID'),
    clientSecret: get('COGNITO_CLIENT_SECRET'), // only if the app client has a secret
    region: get('COGNITO_REGION', { def: get('AWS_REGION', { def: 'ap-south-1' }) }),
  },

  // Admin created by `npm run bootstrap`
  bootstrapAdmin: {
    email: get('BOOTSTRAP_ADMIN_EMAIL'),
    password: get('BOOTSTRAP_ADMIN_PASSWORD'),
    name: get('BOOTSTRAP_ADMIN_NAME', { def: 'System Admin' }),
  },
};

/**
 * Fail fast at startup if required AWS configuration is missing — there is no
 * local fallback. Called from server.js / lambda.js / bootstrap.js.
 */
export function validateEnv({ requireBootstrapAdmin = false } = {}) {
  const missing = [];
  const required = {
    AWS_REGION: env.awsRegion,
    DDB_TABLE_NAME: env.ddbTableName,
    S3_BUCKET: env.s3Bucket,
    COGNITO_USER_POOL_ID: env.cognito.userPoolId,
    COGNITO_CLIENT_ID: env.cognito.clientId,
  };
  if (requireBootstrapAdmin) {
    required.BOOTSTRAP_ADMIN_EMAIL = env.bootstrapAdmin.email;
    required.BOOTSTRAP_ADMIN_PASSWORD = env.bootstrapAdmin.password;
  }
  for (const [key, val] of Object.entries(required)) {
    if (!val) missing.push(key);
  }
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Set them in backend/.env (see .env.example). There is no local fallback.`
    );
  }
}

export default env;
