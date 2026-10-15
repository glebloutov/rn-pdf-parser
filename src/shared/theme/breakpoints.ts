/**
 * Screen-width breakpoints for Unistyles. `compact` covers narrow phones
 * (iPhone SE / mini at 375 pt, most small Androids at 360 dp).
 */
export const breakpoints = {
  compact: 0,
  regular: 390,
} as const;

/** Theme value that is smaller on narrow screens; Unistyles picks it by the current width. */
export const compactOr = <T>(compact: T, regular: T) => ({ compact, regular });
