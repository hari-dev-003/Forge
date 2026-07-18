import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { storage } from './storage/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // Local storage upload target + static file serving (no-op router for S3).
  app.use('/', storage.router());

  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => res.json({ name: 'Forge API', status: 'ok' }));
  app.use(env.apiPrefix, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
