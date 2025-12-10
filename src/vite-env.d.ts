/// <reference types="vite/client" />

declare namespace ImportMeta {
  interface Env {
    readonly VITE_BACKEND_URL?: string;
    readonly VITE_API_PREFIX?: string;
    readonly SOKETI_PORT?: number;
  }
}
