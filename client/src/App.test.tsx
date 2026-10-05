import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import type { HealthResponse } from '@/features/system/useApiHealth';

const health: HealthResponse = {
  status: 'ok',
  service: 'dogwalkr-api',
  version: '0.1.0',
  uptimeSeconds: 12,
  timestamp: '2026-10-05T12:00:00.000Z',
};

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('App', () => {
  it('renders the landing with placeholder CTAs', () => {
    stubFetch(() => new Promise<Response>(() => {}));
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'DogWalkr' })).toBeInTheDocument();
    expect(screen.getByText('Encontrá paseadores de confianza cerca tuyo.')).toBeInTheDocument();

    for (const name of ['Busco paseador', 'Quiero pasear']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription(/Próximamente/);
    }

    expect(screen.getByRole('status')).toHaveTextContent('Conectando…');
  });

  it('shows the API as online when /health responds', async () => {
    const fetchMock = stubFetch(() => Promise.resolve(Response.json(health)));
    render(<App />);

    expect(await screen.findByText('API en línea · v0.1.0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('API en línea · v0.1.0');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/health', expect.anything());
  });

  it('shows the API as offline when the network request fails', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    render(<App />);

    expect(await screen.findByText('Sin conexión con la API')).toBeInTheDocument();
  });

  it('shows the API as offline when /health returns an error', async () => {
    const body = {
      error: { code: 'INTERNAL_ERROR', message: 'Error interno.', requestId: 'req-1' },
    };
    stubFetch(() => Promise.resolve(Response.json(body, { status: 503 })));
    render(<App />);

    expect(await screen.findByText('Sin conexión con la API')).toBeInTheDocument();
  });
});
