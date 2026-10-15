/** ISO calendar date (YYYY-MM-DD) → localized date, rendered in UTC so the day never shifts. */
export const formatDate = (isoDate: string, locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const formatted = formatter.format(new Date(isoDate));

  return formatted;
};
