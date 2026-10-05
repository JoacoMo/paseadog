import type { RequestHandler, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../lib/http-error.js';

// Field-level messages in `details` may be shown by the client, so default zod messages to
// Spanish. Schemas can still override them with their own copy.
z.config(z.locales.es());

const VALIDATED_KEY = 'validated';

type RequestPart = 'body' | 'query' | 'params';

export type ValidationSchemas = Partial<Record<RequestPart, z.ZodType>>;

export type Validated<S extends ValidationSchemas> = {
  [K in keyof S]: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

export type ValidationErrorDetails = Partial<
  Record<RequestPart, { formErrors: string[]; fieldErrors: Record<string, string[]> }>
>;

/**
 * Validates `req.body`, `req.query` and `req.params` against zod schemas.
 *
 * Parsed values (with coercions/defaults applied) are stored on `res.locals.validated` rather
 * than written back to `req`: in Express 5 `req.query` is a getter that re-parses the URL on
 * every access, so reassigning it is not possible. Keeping all three parts in one place keeps
 * handlers consistent; read them with `validated(res, schemas)`.
 *
 * On failure responds 400 `VALIDATION_ERROR` with `details` keyed by part, each being
 * `z.flattenError()` output: `{ body: { formErrors: [], fieldErrors: { email: ['...'] } } }`.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    const sources: Record<RequestPart, unknown> = {
      body: req.body,
      query: req.query,
      params: req.params,
    };
    const parsed: Partial<Record<RequestPart, unknown>> = {};
    const details: ValidationErrorDetails = {};

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (schema === undefined) continue;
      const result = schema.safeParse(sources[part]);
      if (result.success) {
        parsed[part] = result.data;
      } else {
        details[part] = z.flattenError(result.error);
      }
    }

    if (Object.keys(details).length > 0) {
      next(
        new HttpError(
          400,
          'VALIDATION_ERROR',
          'Algunos datos no son válidos. Revisá los campos marcados.',
          { details },
        ),
      );
      return;
    }

    res.locals[VALIDATED_KEY] = parsed;
    next();
  };
}

/**
 * Typed access to what `validate(schemas)` parsed. Pass the same `schemas` object used in the
 * route so the result is inferred from it.
 */
export function validated<S extends ValidationSchemas>(res: Response, _schemas: S): Validated<S> {
  const data: unknown = res.locals[VALIDATED_KEY];
  if (typeof data !== 'object' || data === null) {
    throw new Error('validated() was called on a route without the validate() middleware');
  }
  return data as Validated<S>;
}
