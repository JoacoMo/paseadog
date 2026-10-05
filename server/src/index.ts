import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

// Long enough for in-flight requests to finish, short enough for platform stop timeouts.
const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error, port: env.PORT }, 'Server failed to start');
    process.exit(1);
  }
  logger.info({ port: env.PORT, env: env.NODE_ENV }, `DogWalkr API listening on port ${env.PORT}`);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');

  const forceExit = setTimeout(() => {
    logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Error while closing the HTTP server');
      process.exit(1);
    }
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Idle keep-alive sockets would otherwise hold close() open until the timeout.
  server.closeIdleConnections();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
