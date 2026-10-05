import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

// Incoming IDs end up in logs and response headers, so only accept a short, safe charset
// (covers UUIDs and typical proxy/trace IDs) and mint a fresh one otherwise.
const SAFE_REQUEST_ID = /^[\w.:-]{1,128}$/;

/** Assigns `req.id` (reused by pino-http) and echoes it in the `x-request-id` response header. */
export function requestId(): RequestHandler {
  return (req, res, next) => {
    const incoming = req.get(REQUEST_ID_HEADER)?.trim();
    const id = incoming !== undefined && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}

/** pino-http types `req.id` loosely; `requestId()` runs first, so it is always a string here. */
export function getRequestId(req: Request): string {
  return typeof req.id === 'string' ? req.id : 'unknown';
}
