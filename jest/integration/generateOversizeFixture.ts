import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { FIXTURES_DIR, MOCK_SERVER_DIR } from './mockServer';

export const OVERSIZE_FIXTURE = join(FIXTURES_DIR, 'oversize.csv');

/** Uses the kit's own generator; it writes into the kit's git-ignored fixtures folder. */
export const ensureOversizeFixture = () => {
  if (!existsSync(OVERSIZE_FIXTURE)) {
    execFileSync(process.execPath, [
      join(MOCK_SERVER_DIR, 'make-oversize.mjs'),
    ]);
  }

  return OVERSIZE_FIXTURE;
};
