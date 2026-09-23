import { describe, expect, it, vi } from 'vitest';
import { isTableauUrlSafe, openTableauDashboard } from '../src/services/tableau';
const HOSTS = ['tableau.pfizer.com'];
describe('tableau service', () => {
    it('rejects http URLs', () => {
        expect(isTableauUrlSafe('http://tableau.pfizer.com/x', HOSTS)).toBe(false);
    });
    it('rejects non-allowlisted hosts', () => {
        expect(isTableauUrlSafe('https://evil.example.com/x', HOSTS)).toBe(false);
    });
    it('accepts a valid allowlisted https URL', () => {
        expect(isTableauUrlSafe('https://tableau.pfizer.com/views/x/y', HOSTS)).toBe(true);
    });
    it('rejects empty / invalid inputs', () => {
        expect(isTableauUrlSafe('', HOSTS)).toBe(false);
        expect(isTableauUrlSafe(null, HOSTS)).toBe(false);
        expect(isTableauUrlSafe('javascript:alert(1)', HOSTS)).toBe(false);
        expect(isTableauUrlSafe('not-a-url', HOSTS)).toBe(false);
    });
    it('openTableauDashboard blocks invalid URLs', () => {
        const res = openTableauDashboard('http://x.evil.com', { allowedHosts: HOSTS, openInNewTab: true });
        expect(res.ok).toBe(false);
        expect(res.error).toBeTruthy();
    });
    it('openTableauDashboard opens valid URL in new tab', () => {
        const spy = vi.spyOn(window, 'open').mockReturnValue({});
        const res = openTableauDashboard('https://tableau.pfizer.com/x', { allowedHosts: HOSTS, openInNewTab: true });
        expect(res.ok).toBe(true);
        expect(spy).toHaveBeenCalledWith('https://tableau.pfizer.com/x', '_blank', 'noopener,noreferrer');
        spy.mockRestore();
    });
});
