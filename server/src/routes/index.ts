import { Router } from 'express';
import { createHealthRouter } from '../modules/health/health.routes.js';

export const API_PREFIX = '/api/v1';

/** Builds the router mounted at `/api/v1`. Each feature module contributes its own router. */
export function createApiRouter(): Router {
  const router = Router();

  router.use('/health', createHealthRouter());

  return router;
}
