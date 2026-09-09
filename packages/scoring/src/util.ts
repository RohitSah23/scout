/** Clamp to 0–100 and keep one decimal — no peer normalization. */
export function toScore(value: number): number {
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round(clamped * 10) / 10;
}

/** Explicit decision thresholds (cutoffs), not relative scaling. */
export const SCORE_CUTOFFS = {
  /** #1 leads #2 by more than this → clear winner for x402 gate */
  clearWinnerGap: 10,
  clearWinnerConfidence: 75,
  /** Gap at or below this, or confidence below uncertainConfidence → trigger deep analysis */
  uncertainGap: 5,
  uncertainConfidence: 70,
  strongOpportunity: 70,
  moderateOpportunity: 50,
  highRisk: 60,
} as const;

export function formatScorePoints(value: number): string {
  return value.toFixed(1);
}
