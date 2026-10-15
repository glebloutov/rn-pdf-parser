const POLL_INTERVAL_MS = 100;
const WAIT_TIMEOUT_MS = 8000;

/** Deterministic polling wait: re-runs `step` until `isDone` or times out. */
export const waitFor = async <TValue>(
  step: () => Promise<TValue>,
  isDone: (value: TValue) => boolean,
): Promise<TValue> => {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const value = await step();

    if (isDone(value)) {
      return value;
    }

    await new Promise<void>(resolveDelay => {
      setTimeout(resolveDelay, POLL_INTERVAL_MS);
    });
  }

  throw new Error('waitFor: condition not met in time');
};
