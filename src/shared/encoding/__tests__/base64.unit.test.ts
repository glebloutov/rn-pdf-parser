import { base64ToBytes } from '@shared/encoding/base64';

describe('base64ToBytes', () => {
  it.each(['', 'a', 'ab', 'abc', '%PDF-1.7', 'date,description,amount\n'])(
    'base64ToBytes — %j — matches Node Buffer decoding',
    text => {
      const encoded = Buffer.from(text, 'utf8').toString('base64');

      expect(Array.from(base64ToBytes(encoded))).toEqual(
        Array.from(Buffer.from(text, 'utf8')),
      );
    },
  );

  it('base64ToBytes — all byte values — round-trips', () => {
    const allBytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    const encoded = Buffer.from(allBytes).toString('base64');

    expect(base64ToBytes(encoded)).toEqual(allBytes);
  });
});
