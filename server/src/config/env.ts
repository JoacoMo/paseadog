import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const corsOrigins = z
  .string()
  .transform((value, ctx) => {
    const origins: string[] = [];
    for (const raw of value.split(',')) {
      const candidate = raw.trim();
      if (candidate === '') continue;
      try {
        // Normalizing to the bare origin avoids silent mismatches such as a trailing slash.
        origins.push(new URL(candidate).origin);
      } catch {
        ctx.addIssue({ code: 'custom', message: `"${candidate}" is not a valid origin URL` });
        return z.NEVER;
      }
    }
    return origins;
  })
  .pipe(z.array(z.string()).min(1, 'at least one origin is required'));

// `false`/`true` or a hop count. A hop count (e.g. 1) is preferred behind a hosting proxy
// because `true` trusts any X-Forwarded-For value, which rate limiters reject as spoofable.
const trustProxy = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value, ctx): boolean | number => {
    if (value === 'true') return true;
    if (value === 'false' || value === '0') return false;
    if (/^\d+$/.test(value)) return Number(value);
    ctx.addIssue({ code: 'custom', message: 'expected "true", "false" or a number of proxy hops' });
    return z.NEVER;
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: corsOrigins.default(['http://localhost:5173']),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  TRUST_PROXY: trustProxy.default(false),
});

export type Env = z.output<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment variables:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  // Treat `VAR=` (empty) as unset so defaults apply, matching how most .env files are written.
  const input = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  );
  const result = envSchema.safeParse(input);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  return result.data;
}

function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // The logger depends on env, so write straight to stderr and stop before anything boots.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

export const env: Env = loadEnv();
