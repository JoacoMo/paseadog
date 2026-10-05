import { useApiHealth, type ApiHealthState } from '@/features/system/useApiHealth';

const VARIANTS = {
  loading: {
    pill: 'border-border bg-white text-ink-soft',
    dot: 'bg-ink-soft/60 motion-safe:animate-pulse',
  },
  online: {
    pill: 'border-brand/25 bg-brand-soft text-brand-dark',
    dot: 'bg-brand',
  },
  offline: {
    pill: 'border-danger/25 bg-danger/5 text-danger',
    dot: 'bg-danger',
  },
} as const satisfies Record<ApiHealthState['status'], { pill: string; dot: string }>;

function getLabel(health: ApiHealthState): string {
  switch (health.status) {
    case 'loading':
      return 'Conectando…';
    case 'online':
      return `API en línea · v${health.data.version}`;
    case 'offline':
      return 'Sin conexión con la API';
  }
}

/** Dev-facing pill that shows whether the client can reach the API. */
export function ApiStatusBadge() {
  const health = useApiHealth();
  const variant = VARIANTS[health.status];

  return (
    <p
      role="status"
      title={health.error?.message}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${variant.pill}`}
    >
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${variant.dot}`} />
      {getLabel(health)}
    </p>
  );
}
