import { Router } from 'express';
import { APP_VERSION, SERVICE_NAME } from '../../config/app-info.js';

export interface HealthResponse {
  status: 'ok';
  service: typeof SERVICE_NAME;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      service: SERVICE_NAME,
      version: APP_VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
    // Health probes must always hit the live process, never a cache.
    res.set('Cache-Control', 'no-store').json(body);
  });

  return router;
}
