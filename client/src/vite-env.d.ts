/// <reference types="vite/client" />

// Makes `import.meta.env` reject variables that are not declared below, so a
// typo in a VITE_ name is a type error instead of a silent `undefined`.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  /** Base URL of the DogWalkr API. Defaults to `/api/v1` (proxied by Vite in dev). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
