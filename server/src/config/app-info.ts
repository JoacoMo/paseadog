import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const SERVICE_NAME = 'dogwalkr-api';

// Resolves to server/package.json from both src/config (tsx, vitest) and dist/config (node),
// so package.json stays the single source of truth for the version.
const packageJsonUrl = new URL('../../package.json', import.meta.url);

const packageJsonSchema = z.object({ version: z.string().min(1) });

export const APP_VERSION: string = packageJsonSchema.parse(
  JSON.parse(readFileSync(packageJsonUrl, 'utf8')),
).version;
