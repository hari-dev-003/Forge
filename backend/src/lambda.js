// AWS Lambda entrypoint (API Gateway proxy) — wraps the same Express app via
// serverless-http. Deploy this handler; API Gateway routes /{proxy+} to it.
import serverless from 'serverless-http';
import { createApp } from './app.js';
import { initStore } from './datastore/index.js';
import { validateEnv } from './config/env.js';

let handlerPromise = null;

async function bootstrap() {
  validateEnv();
  await initStore();
  return serverless(createApp());
}

export const handler = async (event, context) => {
  // Reuse the initialised app across warm invocations.
  if (!handlerPromise) handlerPromise = bootstrap();
  const h = await handlerPromise;
  return h(event, context);
};

export default handler;
