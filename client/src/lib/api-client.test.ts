import { describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch, isAbortError } from '@/lib/api-client';
import { env } from '@/lib/env';

function stubFetch(impl: (input: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
}

describe('apiFetch', () => {
  it('joins the path to the API base URL and parses the JSON body', async () => {
    const fetchMock = stubFetch(() =>
      Promise.resolve(Response.json({ status: 'ok', version: '0.1.0' })),
    );

    const data = await apiFetch<{ status: string; version: string }>('/health');

    expect(data).toEqual({ status: 'ok', version: '0.1.0' });
    expect(env.apiUrl).toBe('/api/v1');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/v1/health');
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');
  });

  it('returns undefined for an empty 204 response', async () => {
    stubFetch(() => Promise.resolve(new Response(null, { status: 204 })));

    await expect(apiFetch<undefined>('/walks/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('parses the server error contract into an ApiError', async () => {
    const details = [{ path: ['email'], message: 'Ingresá un email válido.' }];
    stubFetch(() =>
      Promise.resolve(
        Response.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Revisá los datos del formulario.',
              details,
              requestId: 'req-123',
            },
          },
          { status: 422, headers: { 'x-request-id': 'req-123' } },
        ),
      ),
    );

    const error = await captureError(apiFetch('/users'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Revisá los datos del formulario.',
      details,
      requestId: 'req-123',
    });
  });

  it('falls back to a Spanish message and the x-request-id header without a contract body', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response('<html>Bad Gateway</html>', {
          status: 502,
          headers: { 'content-type': 'text/html', 'x-request-id': 'req-502' },
        }),
      ),
    );

    const error = await captureError(apiFetch('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'HTTP_ERROR', requestId: 'req-502' });
    expect((error as ApiError).message).toMatch(/Probá de nuevo/);
  });

  it('rejects a 2xx response whose body is not JSON', async () => {
    stubFetch(() => Promise.resolve(new Response('not json', { status: 200 })));

    const error = await captureError(apiFetch('/health'));

    expect(error).toMatchObject({ status: 200, code: 'INVALID_RESPONSE' });
  });

  it('turns a network failure into a NETWORK_ERROR ApiError', async () => {
    const cause = new TypeError('Failed to fetch');
    stubFetch(() => Promise.reject(cause));

    const error = await captureError(apiFetch('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', cause });
    expect((error as ApiError).message).toMatch(/Revisá tu conexión/);
  });

  it('passes the AbortSignal through and rethrows aborts untouched', async () => {
    const fetchMock = stubFetch(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );
    const controller = new AbortController();

    const pending = captureError(apiFetch('/health', { signal: controller.signal }));
    controller.abort();
    const error = await pending;

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(isAbortError(error)).toBe(true);
  });
});
