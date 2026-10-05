import type { RequestHandler } from 'express';
import { notFound as notFoundError } from '../lib/http-error.js';

/** Catch-all for unmatched routes; the error handler renders the 404 contract. */
export const notFound: RequestHandler = (_req, _res, next) => {
  next(notFoundError());
};
