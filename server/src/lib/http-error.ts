/**
 * Known error codes. The `string & {}` arm keeps autocomplete for these while still
 * allowing feature modules to introduce domain-specific codes later.
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | (string & {});

/** JSON contract for every 4xx/5xx response. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

interface HttpErrorOptions {
  details?: unknown;
  cause?: unknown;
}

/** An error that is safe to expose: its `message` is user-facing (Spanish, rioplatense). */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, options: HttpErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    if (options.details !== undefined) this.details = options.details;
  }
}

export const badRequest = (
  message = 'La solicitud no es válida. Revisá los datos y volvé a intentar.',
  details?: unknown,
): HttpError => new HttpError(400, 'BAD_REQUEST', message, { details });

export const unauthorized = (
  message = 'Necesitás iniciar sesión para continuar.',
  details?: unknown,
): HttpError => new HttpError(401, 'UNAUTHORIZED', message, { details });

export const forbidden = (
  message = 'No tenés permiso para hacer esto. Si creés que es un error, contactanos.',
  details?: unknown,
): HttpError => new HttpError(403, 'FORBIDDEN', message, { details });

export const notFound = (
  message = 'No encontramos lo que buscabas. Revisá la URL.',
  details?: unknown,
): HttpError => new HttpError(404, 'NOT_FOUND', message, { details });

export const conflict = (
  message = 'Ya existe un registro con esos datos. Revisalos y volvé a intentar.',
  details?: unknown,
): HttpError => new HttpError(409, 'CONFLICT', message, { details });
