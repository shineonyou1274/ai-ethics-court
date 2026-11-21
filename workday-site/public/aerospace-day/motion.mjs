// Read on every frame so changing the device preference takes effect immediately.
const query=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
export const reducedMotion=()=>!!query?.matches;
