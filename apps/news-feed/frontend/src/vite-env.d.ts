/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWS_FEED_API_URL?: string;
  readonly VITE_CANVAS_URL?: string;
  readonly VITE_SYSTEM_DESIGN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
