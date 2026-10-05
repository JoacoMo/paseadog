import cors from 'cors';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { httpLogger } from './middlewares/http-logger.js';
import { notFound } from './middlewares/not-found.js';
import { REQUEST_ID_HEADER, requestId } from './middlewares/request-id.js';
import { API_PREFIX, createApiRouter } from './routes/index.js';

export interface AppOptions {
  /** Router mounted at `/api/v1`. Injectable so tests can add routes before the 404 fallback. */
  apiRouter?: Router;
}

export function createApp({ apiRouter = createApiRouter() }: AppOptions = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // Request ID first so every later log line and error body can reference it.
  app.use(requestId());
  app.use(httpLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      exposedHeaders: [REQUEST_ID_HEADER],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use(API_PREFIX, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
