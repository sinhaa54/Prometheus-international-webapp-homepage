/**
 * Static site-wide greeting.
 *
 * Previously time-based ("Good morning/afternoon/evening"), then a longer
 * welcome sentence. v2_new (latest) collapsed it to a single friendly word
 * so the hero title now reads "Greetings! Welcome back." with the second
 * half rendered by the Header itself.
 */
export const HOMEPAGE_GREETING = 'Greetings!';
export function homepageGreeting() {
    return HOMEPAGE_GREETING;
}
