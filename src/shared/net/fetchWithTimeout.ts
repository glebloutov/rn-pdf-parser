/** `AbortSignal.timeout` is not guaranteed on Hermes, so the timeout is built by hand. */
export const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};
