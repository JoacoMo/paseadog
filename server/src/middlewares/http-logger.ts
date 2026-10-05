import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

interface SerializedRequest {
  id: unknown;
  method: string;
  url: string;
  remoteAddress?: string;
}

interface SerializedResponse {
  statusCode: number;
}

/**
 * Structured access log. Runs after `requestId()`, so pino-http reuses `req.id` instead of
 * generating its own. 5xx responses carry `res.err` (set by the error handler) and are logged
 * once, at error level, with the full stack.
 */
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err !== undefined || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // The default serializers dump every request/response header: noisy, and a place where
  // tokens or cookies could leak. Keep only what is needed to trace a request.
  serializers: {
    req: ({ id, method, url, remoteAddress }: SerializedRequest) => ({
      id,
      method,
      url,
      remoteAddress,
    }),
    res: ({ statusCode }: SerializedResponse) => ({ statusCode }),
  },
});
