import type { ErrorRequestHandler } from 'express';
import { HttpError, type ApiErrorBody } from '../lib/http-error.js';
import { getRequestId } from './request-id.js';

const INTERNAL_ERROR_MESSAGE =
  'Tuvimos un problema inesperado. Volvé a intentar en unos minutos y, si sigue pasando, contactanos.';

/**
 * Errors raised by Express' own body parser (raw-body / http-errors) carry a `type` and a
 * 4xx `status`. They are client mistakes, so they are mapped to the public contract instead
 * of surfacing as 500s.
 */
interface BodyParserError {
  type: string;
  status: number;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof error.type === 'string' &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

function toHttpError(error: unknown): HttpError | undefined {
  if (error instanceof HttpError) return error;
  if (!isBodyParserError(error)) return undefined;

  switch (error.type) {
    case 'entity.parse.failed':
      return new HttpError(
        400,
        'BAD_REQUEST',
        'El cuerpo de la solicitud no es un JSON válido. Revisá el formato y volvé a intentar.',
      );
    case 'entity.too.large':
      return new HttpError(
        413,
        'PAYLOAD_TOO_LARGE',
        'El cuerpo de la solicitud es demasiado grande. Reducí su tamaño y volvé a intentar.',
      );
    default:
      return new HttpError(
        error.status,
        'BAD_REQUEST',
        'No pudimos procesar la solicitud. Revisá los datos y volvé a intentar.',
      );
  }
}

/** Central error middleware. Express 5 recognizes it by its 4-argument signature. */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  // Once the response started we can't send the JSON contract; let Express close the socket.
  if (res.headersSent) {
    next(err);
    return;
  }

  const httpError = toHttpError(err);
  const status = httpError?.status ?? 500;

  if (status >= 500) {
    // pino-http logs the finished request at error level with this error and its stack.
    res.err = err instanceof Error ? err : new Error(String(err));
  } else {
    req.log.debug({ code: httpError?.code, details: httpError?.details }, 'client error');
  }

  // Only HttpErrors are deliberately user-facing. Anything else gets a generic message so
  // internals (SQL, stack traces, hostnames) never reach the client.
  const body: ApiErrorBody = {
    error: httpError
      ? {
          code: httpError.code,
          message: httpError.message,
          ...(httpError.details !== undefined ? { details: httpError.details } : {}),
          requestId: getRequestId(req),
        }
      : { code: 'INTERNAL_ERROR', message: INTERNAL_ERROR_MESSAGE, requestId: getRequestId(req) },
  };

  res.status(status).json(body);
};
