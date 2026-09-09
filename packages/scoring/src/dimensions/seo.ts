import type { DimensionScore, OnchainMetrics, SeoMetrics } from "@scout/schemas";
import { toScore } from "../util.js";
import { DIMENSION_WEIGHTS } from "./onchain.js";

export function scoreSearchDemand(
  metrics: SeoMetrics | undefined,
  evidenceIds: string[],
): DimensionScore {
  const demand = metrics?.searchDemandChangePct ?? 0;
  const devIntent = metrics?.developerIntentScore ?? 50;
  const score = toScore(demand * 0.6 + devIntent * 0.4);
  return {
    key: "searchDemand",
    weight: DIMENSION_WEIGHTS.searchDemand,
    score,
    rationale: `Search demand ${demand >= 0 ? "+" : ""}${demand.toFixed(1)}%, developer-intent ${devIntent.toFixed(1)}/100`,
    evidenceIds,
  };
}

export function scoreCompetitiveGap(
  onchain: OnchainMetrics | undefined,
  seo: SeoMetrics | undefined,
  onchainRankScore: number,
  evidenceIds: string[],
): DimensionScore {
  const serpDom = seo?.competitorSerpDominance ?? 50;
  const gap = onchainRankScore - serpDom;
  const score = toScore(50 + gap);
  const onchainUp = (onchain?.tvlChangePct ?? 0) > 20;
  const searchFlat = (seo?.searchDemandChangePct ?? 0) < 15;
  const rationale =
    onchainUp && searchFlat
      ? "Strong on-chain adoption with weak competitor SEO moat"
      : `On-chain rank ${onchainRankScore.toFixed(1)} vs SERP dominance ${serpDom.toFixed(1)}`;
  return {
    key: "competitiveGap",
    weight: DIMENSION_WEIGHTS.competitiveGap,
    score,
    rationale,
    evidenceIds,
  };
}

export function scoreSeoOpportunity(
  metrics: SeoMetrics | undefined,
  onchain: OnchainMetrics | undefined,
  evidenceIds: string[],
): DimensionScore {
  const visibility = metrics?.organicVisibility ?? 50;
  const gap = metrics?.contentGapScore ?? 50;
  const onchainHot = (onchain?.tvlChangePct ?? 0) > 15;
  const score = toScore((100 - visibility) * 0.4 + gap * 0.4 + (onchainHot ? 20 : 0));
  return {
    key: "seoOpportunity",
    weight: DIMENSION_WEIGHTS.seoOpportunity,
    score,
    rationale: `Organic visibility ${visibility.toFixed(1)}/100, content gap ${gap.toFixed(1)}/100`,
    evidenceIds,
  };
}

export function buildGapSignal(
  onchain: OnchainMetrics | undefined,
  seo: SeoMetrics | undefined,
): string | undefined {
  const onchainAvg =
    ((onchain?.tvlChangePct ?? 0) +
      (onchain?.volumeChangePct ?? 0) +
      (onchain?.activeAddressesChangePct ?? 0)) /
    3;
  const search = seo?.searchDemandChangePct ?? 0;
  if (onchainAvg > 20 && search < 15) {
    return `on-chain +${onchainAvg.toFixed(1)}% but search +${search.toFixed(1)}%`;
  }
  return undefined;
}
