const BYTES_IN_KIBIBYTE = 1024;
const BYTES_IN_MEBIBYTE = BYTES_IN_KIBIBYTE * BYTES_IN_KIBIBYTE;
const FRACTION_DIGITS = 1;

export type FileSizeUnit = 'bytes' | 'kibibytes' | 'mebibytes';

export interface IFileSizeParts {
  unit: FileSizeUnit;
  value: string;
}

/** Splits a byte count into a translatable unit key + formatted number. */
export const toFileSizeParts = (
  sizeBytes: number,
  locale: string,
): IFileSizeParts => {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: FRACTION_DIGITS,
  });

  if (sizeBytes < BYTES_IN_KIBIBYTE) {
    return { unit: 'bytes', value: String(sizeBytes) };
  }

  if (sizeBytes < BYTES_IN_MEBIBYTE) {
    return {
      unit: 'kibibytes',
      value: formatter.format(sizeBytes / BYTES_IN_KIBIBYTE),
    };
  }

  return {
    unit: 'mebibytes',
    value: formatter.format(sizeBytes / BYTES_IN_MEBIBYTE),
  };
};
