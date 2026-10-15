export type Result<TValue, TError> =
  { ok: true; value: TValue } | { ok: false; error: TError };

export const ok = <TValue>(value: TValue): { ok: true; value: TValue } => ({
  ok: true,
  value,
});

export const err = <TError>(error: TError): { ok: false; error: TError } => ({
  ok: false,
  error,
});
