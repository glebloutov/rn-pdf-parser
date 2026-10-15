import {
  DEFAULT_API_BASE_URL,
  resolveApiBaseUrl,
} from '@shared/config/apiConfig';
import { baseUrlSchema } from '@shared/config/baseUrlSchema';

describe('baseUrlSchema', () => {
  it('baseUrlSchema — LAN address with spaces and trailing slash — normalised', () => {
    expect(baseUrlSchema.parse('  http://192.168.1.20:8787/ ')).toBe(
      'http://192.168.1.20:8787',
    );
  });

  it.each(['127.0.0.1:8787', 'ftp://host', 'not a url', ''])(
    'baseUrlSchema — %j — rejected',
    value => {
      expect(baseUrlSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('resolveApiBaseUrl', () => {
  it('resolveApiBaseUrl — no .env value — default 127.0.0.1:8787', () => {
    expect(resolveApiBaseUrl(undefined)).toBe(DEFAULT_API_BASE_URL);
  });

  it('resolveApiBaseUrl — valid LAN URL — used as is', () => {
    expect(resolveApiBaseUrl('http://192.168.1.20:8787/')).toBe(
      'http://192.168.1.20:8787',
    );
  });

  it('resolveApiBaseUrl — invalid value — default', () => {
    expect(resolveApiBaseUrl('192.168.1.20')).toBe(DEFAULT_API_BASE_URL);
  });
});
