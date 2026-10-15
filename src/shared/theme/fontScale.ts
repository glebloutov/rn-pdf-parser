/**
 * Upper bound for the system font scale. Text still grows with the user's setting up to 2× (Android's
 * maximum), but iOS accessibility sizes (up to ~3×) no longer break words like "StreamBeam" mid-word.
 */
export const MAX_FONT_SCALE = 2;
