/**
 * Runtime configuration. All values are safe to ship to the browser -
 * NO SECRETS. API/base paths can be overridden via Vite env variables at
 * build time so the same bundle works under Dataiku's non-root base path.
 */
export const APP_CONFIG = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
  basePath: import.meta.env.VITE_BASE_PATH ?? '/',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
  apiTimeoutMs: 15_000,
} as const;
