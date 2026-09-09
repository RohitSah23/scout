import type { DimensionKey, DimensionScore, OnchainMetrics } from "@scout/schemas";
import { toScore } from "../util.js";

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  onchainGrowth: 0.3,
  userGrowth: 0.2,
  searchDemand: 0.2,
  competitiveGap: 0.15,
  seoOpportunity: 0.1,
  evidenceConfidence: 0.05,
};

export function normalizePctChange(pct: number): number {
  return Math.min(100, Math.max(0, 50 + pct));
}

export function scoreOnchainGrowth(
  metrics: OnchainMetrics | undefined,
  evidenceIds: string[],
): DimensionScore {
  const tvl = metrics?.tvlChangePct ?? 0;
  const vol = metrics?.volumeChangePct ?? 0;
  const tx = metrics?.txChangePct ?? 0;
  const score = toScore(
    normalizePctChange(tvl) * 0.35 +
      normalizePctChange(vol) * 0.35 +
      normalizePctChange(tx) * 0.3,
  );
  return {
    key: "onchainGrowth",
    weight: DIMENSION_WEIGHTS.onchainGrowth,
    score,
    rationale: `TVL ${tvl >= 0 ? "+" : ""}${tvl.toFixed(1)}%, volume ${vol >= 0 ? "+" : ""}${vol.toFixed(1)}%, txs ${tx >= 0 ? "+" : ""}${tx.toFixed(1)}%`,
    evidenceIds,
  };
}

export function scoreUserGrowth(
  metrics: OnchainMetrics | undefined,
  evidenceIds: string[],
): DimensionScore {
  const active = metrics?.activeAddressesChangePct ?? 0;
  const newUsers = metrics?.newUsersChangePct ?? 0;
  let score = toScore(normalizePctChange(active) * 0.6 + normalizePctChange(newUsers) * 0.4);
  const tx = metrics?.txChangePct ?? 0;
  if (tx > 30 && active < 5) {
    score = toScore(score - 20);
  }
  return {
    key: "userGrowth",
    weight: DIMENSION_WEIGHTS.userGrowth,
    score,
    rationale: `Active addresses ${active >= 0 ? "+" : ""}${active.toFixed(1)}%, new users ${newUsers >= 0 ? "+" : ""}${newUsers.toFixed(1)}%`,
    evidenceIds,
  };
}
