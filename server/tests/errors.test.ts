import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { conflict } from '../src/lib/http-error.js';
import { createApiRouter } from '../src/routes/index.js';

interface ErrorResponse {
  error: { code: string; message: string; details?: unknown; requestId: string };
}

function buildApp() {
  const apiRouter = createApiRouter();
  apiRouter.get('/__test/http-error', () => {
    throw conflict(undefined, { field: 'email' });
  });
  apiRouter.get('/__test/sync-crash', () => {
    throw new Error('db password is hunter2');
  });
  apiRouter.get('/__test/async-crash', async () => {
    await Promise.resolve();
    throw new Error('connection to 10.0.0.5 refused');
  });
  apiRouter.post('/__test/echo', (req, res) => {
    res.json({ received: req.body as unknown });
  });
  return createApp({ apiRouter });
}

describe('error contract', () => {
  const app = buildApp();

  it('maps unknown routes to a 404 NOT_FOUND JSON error', async () => {
    const res = await request(app).get('/api/v1/nope');
    const body = res.body as ErrorResponse;

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'No encontramos lo que buscabas. Revisá la URL.',
        requestId: res.headers['x-request-id'] as string,
      },
    });
  });

  it('uses the incoming request id in error bodies', async () => {
    const res = await request(app).get('/api/v1/nope').set('x-request-id', 'req-123');

    expect((res.body as ErrorResponse).error.requestId).toBe('req-123');
  });

  it('also returns the 404 contract outside /api/v1', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(404);
    expect((res.body as ErrorResponse).error.code).toBe('NOT_FOUND');
  });

  it('renders a thrown HttpError with its status, code and details', async () => {
    const res = await request(app).get('/api/v1/__test/http-error');
    const body = res.body as ErrorResponse;

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toMatch(/Revisalos/);
    expect(body.error.details).toEqual({ field: 'email' });
    expect(body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it.each(['/api/v1/__test/sync-crash', '/api/v1/__test/async-crash'])(
    'maps unexpected errors to a generic 500 without leaking internals (%s)',
    async (path) => {
      const res = await request(app).get(path);
      const body = res.body as ErrorResponse;

      expect(res.status).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toMatch(/Volvé a intentar/);
      expect(body.error).not.toHaveProperty('details');
      expect(res.text).not.toMatch(/hunter2|10\.0\.0\.5|Error:|at /);
    },
  );

  it('maps a malformed JSON body to 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/v1/__test/echo')
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    const body = res.body as ErrorResponse;

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toMatch(/JSON/);
    expect(body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('maps an oversized JSON body to 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(app)
      .post('/api/v1/__test/echo')
      .send({ blob: 'x'.repeat(150 * 1024) });

    expect(res.status).toBe(413);
    expect((res.body as ErrorResponse).error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
