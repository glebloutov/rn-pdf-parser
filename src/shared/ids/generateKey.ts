import 'react-native-get-random-values';
import { v4 as uuidV4 } from 'uuid';

/** UUID v4 (36 chars, secure RNG polyfill) — fits the server's 8–128 character Idempotency-Key rule. */
export const generateKey = () => uuidV4();
