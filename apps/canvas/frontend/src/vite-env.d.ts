/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANVAS_API_URL?: string;
  readonly VITE_NEWS_FEED_URL?: string;
  readonly VITE_SYSTEM_DESIGN_URL?: string;
  readonly VITE_NEWS_FEED_API_URL?: string;
  readonly VITE_SYSTEM_DESIGN_QA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
