// Contact is an impulse, not a pause. Keep one short fully-depressed beat so it
// remains readable at 60 fps, then release before the next fast-run strike.
const KEY_HOLD_MS = 12;
const KEY_RELEASE_MS = 96;

/** Deterministic piano-key travel shared by live preview and exported frames. */
export function instrumentKeyPressAtTime(hitTimeMs: number, timeMs: number) {
  const age = timeMs - hitTimeMs;
  if (age < 0 || age >= KEY_HOLD_MS + KEY_RELEASE_MS) return 0;
  if (age <= KEY_HOLD_MS) return 1;
  const remaining = 1 - (age - KEY_HOLD_MS) / KEY_RELEASE_MS;
  return remaining * remaining * (3 - 2 * remaining);
}
