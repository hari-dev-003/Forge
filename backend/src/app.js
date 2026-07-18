import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Behind API Gateway / CloudFront — trust the proxy for correct protocol/IP.
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  // Security headers.
  app.use(helmet());

  // CORS — the app uses Bearer tokens (no cookies), so credentials are off and
  // the origin is restricted to the configured app URL(s) in production.
  const origins = env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((o) => o.trim());
  if (env.isProd && origins === '*') {
    logger.warn('CORS_ORIGIN is "*" in production — restrict it to your Amplify app origin(s).');
  }
  app.use(
    cors({
      origin: origins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  if (!env.isProd) app.use(morgan('dev'));

  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => res.json({ name: 'Forge API', status: 'ok' }));
  app.use(env.apiPrefix, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
