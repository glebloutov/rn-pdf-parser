const MINOR_UNITS_IN_MAJOR = 100;

export const formatMoney = (
  amountMinor: number,
  currency: string,
  locale: string,
) => {
  const formatter = new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
  });
  const formatted = formatter.format(amountMinor / MINOR_UNITS_IN_MAJOR);

  return formatted;
};
