/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORDJUMP_RANDOM_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
