// Local dev entrypoint. For AWS, `lambda.js` wraps the same app.
import { createApp } from './app.js';
import { initStore } from './datastore/index.js';
import { env, validateEnv } from './config/env.js';
import { logger } from './lib/logger.js';

// ── Resilience: never let a single stray async error take the server down ──
// Route errors are already caught (asyncHandler → errorHandler). These catch
// errors OUTSIDE request handling (background tasks, event emitters, forgotten
// awaits). Without them, Node exits on the first unhandled error — and nodemon
// does NOT auto-restart on a crash (it waits for a file change), so the backend
// would silently stay down. We log and keep serving.
// (In production, prefer a process manager — pm2/systemd/ECS — to restart.)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection — server kept alive', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — server kept alive', { message: err.message, stack: err.stack });
});

async function main() {
  validateEnv();
  await initStore();
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Forge API listening on http://localhost:${env.port}${env.apiPrefix}`, {
      region: env.awsRegion,
      table: env.ddbTableName,
      bucket: env.s3Bucket,
      userPool: env.cognito.userPoolId,
    });
  });

  // Clear message on the most common startup failure instead of a raw crash.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.port} is already in use — stop the other process or change PORT in .env`);
    } else {
      logger.error('HTTP server error', { message: err.message, code: err.code });
    }
    process.exit(1);
  });

  // Graceful shutdown on Ctrl+C / termination.
  const shutdown = (signal) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((e) => {
  logger.error('Failed to start server', { message: e.message, stack: e.stack });
  process.exit(1);
});
// Trigger nodemon restart to pick up latest .env changes

