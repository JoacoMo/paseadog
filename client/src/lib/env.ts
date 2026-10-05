const DEFAULT_API_URL = '/api/v1';

/** Trailing slashes are dropped so paths can always be joined as `${apiUrl}/x`. */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function readApiUrl(): string {
  // A blank value (e.g. `VITE_API_URL=` copied from .env.example) means "use the default".
  const raw = import.meta.env.VITE_API_URL?.trim();
  return normalizeBaseUrl(raw ? raw : DEFAULT_API_URL);
}

/** Typed, defaulted view of the client's build-time environment. */
export const env = {
  apiUrl: readApiUrl(),
  isDev: import.meta.env.DEV,
} as const;
