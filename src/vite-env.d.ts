/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_HOTSPOT_USERNAME?: string;
  readonly VITE_HOTSPOT_PASSWORD?: string;
  readonly VITE_WIFI_FALLBACK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
