import { env } from '@/lib/env';

/** Error body returned by every DogWalkr API endpoint on a non-2xx response. */
export interface ApiErrorBody {
  error: {
    code: string;
    /** Spanish, user-facing. */
    message: string;
    details?: unknown;
    requestId: string;
  };
}

/** Client-side codes, for failures that never produced a server error body. */
export const CLIENT_ERROR_CODES = {
  network: 'NETWORK_ERROR',
  invalidResponse: 'INVALID_RESPONSE',
  http: 'HTTP_ERROR',
  unknown: 'UNKNOWN_ERROR',
} as const;

const MESSAGES = {
  network:
    'No pudimos conectarnos con el servidor. Revisá tu conexión a internet y probá de nuevo.',
  invalidResponse: 'El servidor respondió algo que no esperábamos. Probá de nuevo en unos minutos.',
  serverError: 'Tuvimos un problema en el servidor. Probá de nuevo en unos minutos.',
  requestError: 'No pudimos completar la operación. Revisá los datos y probá de nuevo.',
  unknown: 'Algo salió mal. Recargá la página y probá de nuevo.',
} as const;

interface ApiErrorInit {
  /** HTTP status, or 0 when the request never got a response. */
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | undefined;
  cause?: unknown;
}

export class ApiError extends Error {
  override name = 'ApiError';
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  /** Correlates with server logs; show it in bug reports. */
  readonly requestId: string | undefined;

  constructor({ status, code, message, details, requestId, cause }: ApiErrorInit) {
    super(message, { cause });
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  return typeof value.error.code === 'string' && typeof value.error.message === 'string';
}

/** Aborts are intentional (unmount, superseded request), so callers usually ignore them. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function buildUrl(path: string): string {
  return `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Returns `undefined` for an empty body and throws `SyntaxError` for invalid JSON. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text === '' ? undefined : (JSON.parse(text) as unknown);
}

function toHttpError(response: Response, body: unknown): ApiError {
  const headerRequestId = response.headers.get('x-request-id') ?? undefined;

  if (isApiErrorBody(body)) {
    const { code, message, details, requestId } = body.error;
    return new ApiError({
      status: response.status,
      code,
      message,
      details,
      requestId: requestId || headerRequestId,
    });
  }

  // No contract body: e.g. the dev proxy answering 502 because the API is down.
  return new ApiError({
    status: response.status,
    code: CLIENT_ERROR_CODES.http,
    message: response.status >= 500 ? MESSAGES.serverError : MESSAGES.requestError,
    details: body,
    requestId: headerRequestId,
  });
}

/**
 * Calls the DogWalkr API and returns the parsed JSON body.
 *
 * `T` is trusted, not validated at runtime. Throws `ApiError` for HTTP errors,
 * network failures and unparseable bodies. An aborted request rethrows the
 * original abort error (see `isAbortError`) so it is not mistaken for a failure.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(buildUrl(path), { ...init, headers });
  } catch (error) {
    if (init.signal?.aborted || isAbortError(error)) throw error;
    throw new ApiError({
      status: 0,
      code: CLIENT_ERROR_CODES.network,
      message: MESSAGES.network,
      cause: error,
    });
  }

  let body: unknown;
  try {
    body = await readJson(response);
  } catch (error) {
    if (init.signal?.aborted || isAbortError(error)) throw error;
    if (!response.ok) throw toHttpError(response, undefined);
    throw new ApiError({
      status: response.status,
      code: CLIENT_ERROR_CODES.invalidResponse,
      message: MESSAGES.invalidResponse,
      requestId: response.headers.get('x-request-id') ?? undefined,
      cause: error,
    });
  }

  if (!response.ok) throw toHttpError(response, body);
  return body as T;
}

/** Normalizes anything thrown around `apiFetch` into an `ApiError` for the UI. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError({
    status: 0,
    code: CLIENT_ERROR_CODES.unknown,
    message: MESSAGES.unknown,
    cause: error,
  });
}
