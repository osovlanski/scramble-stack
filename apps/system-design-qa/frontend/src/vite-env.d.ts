/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYSTEM_DESIGN_QA_API_URL?: string;
  readonly VITE_CANVAS_URL?: string;
  readonly VITE_NEWS_FEED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
