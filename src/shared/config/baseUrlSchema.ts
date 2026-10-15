import { z } from 'zod';

const HTTP_PROTOCOL = /^https?$/;
const TRAILING_SLASHES = /\/+$/;

/** User-entered API host: trimmed, http(s) only, no trailing slash (paths are appended). */
export const baseUrlSchema = z
  .string()
  .trim()
  .pipe(z.url({ protocol: HTTP_PROTOCOL }))
  .transform(url => url.replace(TRAILING_SLASHES, ''));
