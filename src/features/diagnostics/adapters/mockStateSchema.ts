import { z } from 'zod';

import type { IMockState } from '@features/diagnostics/ports';

/** Shape of `GET /__test/state`; counters are a free-form name → number map. */
export const mockStateSchema = z.object({
  jobs: z.array(
    z.object({
      bytes: z.number(),
      jobId: z.string(),
      status: z.string(),
    }),
  ),
  mode: z.string(),
  stats: z.record(z.string(), z.number()),
}) satisfies z.ZodType<IMockState>;
