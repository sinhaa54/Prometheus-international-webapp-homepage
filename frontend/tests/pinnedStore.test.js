import { describe, expect, it, beforeEach } from 'vitest';
import { createLocalPinnedStore } from '../src/features/favourites/pinnedStore';
describe('pinnedStore', () => {
    beforeEach(() => {
        try {
            window.localStorage.clear();
        }
        catch { /* noop */ }
    });
    it('starts empty', () => {
        const s = createLocalPinnedStore();
        expect(s.read()).toEqual([]);
    });
    it('toggles ids on and off', () => {
        const s = createLocalPinnedStore();
        expect(s.toggle('A')).toEqual(['A']);
        expect(s.toggle('B')).toEqual(['A', 'B']);
        expect(s.toggle('A')).toEqual(['B']);
    });
    it('persists across new store instances', () => {
        const s1 = createLocalPinnedStore();
        s1.toggle('X');
        const s2 = createLocalPinnedStore();
        expect(s2.read()).toEqual(['X']);
    });
    it('reports availability of storage', () => {
        const s = createLocalPinnedStore();
        expect(typeof s.isAvailable()).toBe('boolean');
    });
});
