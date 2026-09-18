import { describe, expect, it } from 'vitest';
import { HOMEPAGE_GREETING, homepageGreeting } from '../src/utils/greeting';

describe('greeting', () => {
  it('returns the fixed Prometheus greeting', () => {
    expect(homepageGreeting()).toBe(HOMEPAGE_GREETING);
  });
  it('greeting is a short word ending with an exclamation', () => {
    expect(homepageGreeting()).toMatch(/^Greetings!$/);
  });
});
