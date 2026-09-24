/**
 * Runtime configuration. All values are safe to ship to the browser -
 * NO SECRETS. API/base paths can be overridden via Vite env variables at
 * build time so the same bundle works under Dataiku's non-root base path.
 *
 * In Dataiku production the global `getWebAppBackendUrl` function is
 * injected by the DSS webapp runner and returns the authenticated
 * backend proxy URL. We use it when available; otherwise fall back to
 * the Vite env var or the local dev default (`/api`).
 */
function getBackendProdUrl() {
    // @ts-ignore – injected by Dataiku DSS at runtime
    const fn = window['getWebAppBackendUrl'] || parent['getWebAppBackendUrl'];
    if (typeof fn === 'function') {
        return fn('');
    }
    return null;
}
const backendProdBase = getBackendProdUrl();
export const APP_CONFIG = {
    apiBaseUrl: (backendProdBase ?? import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
    basePath: import.meta.env.VITE_BASE_PATH ?? '/',
    appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
    apiTimeoutMs: 15_000,
};
