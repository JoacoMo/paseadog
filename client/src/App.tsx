import { ApiStatusBadge } from '@/features/system/ApiStatusBadge';

const COMING_SOON_HINT_ID = 'cta-coming-soon';

const baseButton =
  'flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold transition-colors aria-disabled:cursor-not-allowed';

export function App() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-[2rem] bg-brand-soft p-3">
            <img
              src="/icons/icon-192.png"
              alt=""
              width={88}
              height={88}
              className="size-22 rounded-3xl shadow-sm"
            />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink">
            Dog<span className="text-brand">Walkr</span>
          </h1>
          <p className="mt-3 max-w-xs text-lg text-balance text-ink-soft">
            Encontrá paseadores de confianza cerca tuyo.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {/* aria-disabled (not `disabled`) keeps the buttons focusable, so screen
              readers still reach them and hear the "Próximamente" hint. */}
          <button
            type="button"
            aria-disabled="true"
            aria-describedby={COMING_SOON_HINT_ID}
            className={`${baseButton} bg-brand text-white opacity-80`}
          >
            Busco paseador
          </button>
          <button
            type="button"
            aria-disabled="true"
            aria-describedby={COMING_SOON_HINT_ID}
            className={`${baseButton} border-2 border-brand bg-white text-brand-dark opacity-80`}
          >
            Quiero pasear
          </button>
          <p id={COMING_SOON_HINT_ID} className="mt-1 text-center text-sm text-ink-soft">
            Próximamente: estamos preparando todo para tu primer paseo.
          </p>
        </div>
      </main>

      <footer className="flex justify-center px-6 pb-6">
        <ApiStatusBadge />
      </footer>
    </div>
  );
}
