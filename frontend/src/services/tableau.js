/** Validate a Tableau URL against the metadata-provided allowlist. */
export function isTableauUrlSafe(url, allowedHosts) {
    if (!url)
        return false;
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return false;
    }
    if (parsed.protocol !== 'https:')
        return false;
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.map((h) => h.toLowerCase()).includes(host);
}
/**
 * Open a Tableau dashboard URL safely.
 * - Validates against allowlist before opening.
 * - Uses noopener,noreferrer to prevent tab-nabbing.
 * - Returns whether the redirect was performed.
 */
export function openTableauDashboard(url, opts) {
    if (!url)
        return { ok: false, error: 'This dashboard has no Tableau URL configured.' };
    if (!isTableauUrlSafe(url, opts.allowedHosts)) {
        return { ok: false, error: 'This dashboard URL is not on the approved Tableau allowlist.' };
    }
    if (opts.openInNewTab) {
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        // Some browsers still return null for popup-blocked; report a clear message.
        if (w === null) {
            return { ok: false, error: 'Popup was blocked. Please allow popups to open Tableau dashboards.' };
        }
    }
    else {
        window.location.href = url;
    }
    return { ok: true };
}
