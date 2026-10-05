import { pino } from 'pino';
import { env } from '../config/env.js';
import { SERVICE_NAME } from '../config/app-info.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  base: { service: SERVICE_NAME },
  redact: {
    // Auth arrives in Phase 4 (Supabase JWT); keep tokens and cookies out of logs from day one.
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[redacted]',
  },
  // pino-pretty is a devDependency, so it must only be required in development.
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
        }
      : undefined,
});
