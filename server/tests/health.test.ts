import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('responds 200 with the health contract', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'dogwalkr-api',
      version: '0.1.0',
      uptimeSeconds: expect.any(Number) as number,
      timestamp: expect.any(String) as string,
    });
    const body = res.body as { timestamp: string };
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('generates an x-request-id when the client sends none', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-request-id']).toMatch(UUID);
  });

  it('echoes a safe incoming x-request-id', async () => {
    const res = await request(app).get('/api/v1/health').set('x-request-id', 'trace-abc_123.4:5');

    expect(res.headers['x-request-id']).toBe('trace-abc_123.4:5');
  });

  it('replaces an unsafe or oversized x-request-id', async () => {
    const unsafe = await request(app).get('/api/v1/health').set('x-request-id', 'bad id<script>');
    const oversized = await request(app).get('/api/v1/health').set('x-request-id', 'a'.repeat(200));

    expect(unsafe.headers['x-request-id']).toMatch(UUID);
    expect(oversized.headers['x-request-id']).toMatch(UUID);
  });

  it('allows the configured client origin via CORS and exposes x-request-id', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-expose-headers']).toMatch(/x-request-id/i);
  });

  it('does not allow unknown origins', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not advertise Express', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
