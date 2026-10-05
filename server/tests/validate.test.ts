import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { validate, validated, type ValidationErrorDetails } from '../src/middlewares/validate.js';
import { createApiRouter } from '../src/routes/index.js';

interface ValidationErrorResponse {
  error: { code: string; message: string; details: ValidationErrorDetails; requestId: string };
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }),
  body: z.object({ name: z.string().trim().min(2), size: z.enum(['small', 'medium', 'large']) }),
};

function buildApp() {
  const apiRouter = createApiRouter();
  apiRouter.post('/__test/dogs/:id', validate(schemas), (_req, res) => {
    res.json(validated(res, schemas));
  });
  return createApp({ apiRouter });
}

const ID = '3f2b6c1e-8a4d-4f0a-9b7e-2c5d1e0f9a8b';

describe('validate middleware', () => {
  const app = buildApp();

  it('passes parsed values (coerced, defaulted, trimmed) to the handler', async () => {
    const res = await request(app)
      .post(`/api/v1/__test/dogs/${ID}?limit=5`)
      .send({ name: '  Firulais ', size: 'medium' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { id: ID },
      query: { limit: 5 },
      body: { name: 'Firulais', size: 'medium' },
    });
  });

  it('applies query defaults', async () => {
    const res = await request(app)
      .post(`/api/v1/__test/dogs/${ID}`)
      .send({ name: 'Toby', size: 'small' });

    expect((res.body as { query: unknown }).query).toEqual({ limit: 10 });
  });

  it('rejects an invalid body with 400 VALIDATION_ERROR and flattened field errors', async () => {
    const res = await request(app)
      .post(`/api/v1/__test/dogs/${ID}`)
      .send({ name: 'x', size: 'huge' });
    const body = res.body as ValidationErrorResponse;

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Algunos datos no son válidos. Revisá los campos marcados.');
    expect(body.error.requestId).toBe(res.headers['x-request-id']);
    expect(Object.keys(body.error.details)).toEqual(['body']);
    expect(Object.keys(body.error.details.body?.fieldErrors ?? {}).sort()).toEqual([
      'name',
      'size',
    ]);
  });

  it('reports every invalid part at once', async () => {
    const res = await request(app).post('/api/v1/__test/dogs/not-a-uuid?limit=500').send({});
    const body = res.body as ValidationErrorResponse;

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.params?.fieldErrors).toHaveProperty('id');
    expect(body.error.details.query?.fieldErrors).toHaveProperty('limit');
    expect(body.error.details.body?.fieldErrors).toHaveProperty('name');
  });

  it('rejects a missing body', async () => {
    const res = await request(app).post(`/api/v1/__test/dogs/${ID}`);
    const body = res.body as ValidationErrorResponse;

    expect(res.status).toBe(400);
    expect(body.error.details.body?.formErrors.length).toBeGreaterThan(0);
  });
});
