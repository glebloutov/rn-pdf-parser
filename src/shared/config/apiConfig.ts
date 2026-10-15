import { MOCK_API_URL } from '@env';

import { baseUrlSchema } from '@shared/config/baseUrlSchema';

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8787';
export const REQUEST_TIMEOUT_MS = 15000;

/** `.env` value when it's a valid http(s) URL, otherwise the default. */
export const resolveApiBaseUrl = (configuredUrl: string | undefined) => {
  const parsed = baseUrlSchema.safeParse(configuredUrl);

  return parsed.success ? parsed.data : DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = resolveApiBaseUrl(MOCK_API_URL);
