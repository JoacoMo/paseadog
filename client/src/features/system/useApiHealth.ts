import { useEffect, useState } from 'react';

import { apiFetch, toApiError, type ApiError } from '@/lib/api-client';

/** Body of `GET /api/v1/health`. */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  /** ISO 8601. */
  timestamp: string;
}

export type ApiHealthState =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'online'; data: HealthResponse; error?: undefined }
  | { status: 'offline'; data?: undefined; error: ApiError };

/** Pings the API once on mount; the request is aborted if the component unmounts first. */
export function useApiHealth(): ApiHealthState {
  const [state, setState] = useState<ApiHealthState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    apiFetch<HealthResponse>('/health', { signal: controller.signal })
      .then((data) => {
        setState({ status: 'online', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'offline', error: toApiError(error) });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return state;
}
