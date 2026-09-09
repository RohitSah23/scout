/** Display raw opportunity/risk scores with one decimal — no rounding to integers. */
export function formatScore(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}
