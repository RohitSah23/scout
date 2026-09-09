import type { Candidate, DimensionScore } from "@scout/schemas";
import { toScore } from "../util.js";
import { DIMENSION_WEIGHTS } from "./onchain.js";

export function scoreEvidenceConfidence(
  candidate: Candidate,
  sourceCount: number,
  hasPaidAnalysis: boolean,
  evidenceIds: string[],
): DimensionScore {
  let score = 40 + sourceCount * 10;
  if (candidate.onchainMetrics) score += 15;
  if (candidate.seoMetrics) score += 15;
  if (hasPaidAnalysis) {
    score += (candidate.deepAnalysis?.confidenceBoost ?? 0.1) * 100;
  }
  const onchain = candidate.onchainMetrics;
  if (
    onchain &&
    (onchain.txChangePct ?? 0) > 30 &&
    (onchain.activeAddressesChangePct ?? 0) < 5
  ) {
    score -= 15;
  }
  return {
    key: "evidenceConfidence",
    weight: DIMENSION_WEIGHTS.evidenceConfidence,
    score: toScore(score),
    rationale: `${sourceCount} sources, ${hasPaidAnalysis ? "paid deep analysis included" : "free evidence only"}`,
    evidenceIds,
  };
}

export function computeMomentum(
  metrics: Candidate["onchainMetrics"],
): "heating" | "stable" | "cooling" {
  const current =
    ((metrics?.tvlChangePct ?? 0) +
      (metrics?.volumeChangePct ?? 0) +
      (metrics?.activeAddressesChangePct ?? 0)) /
    3;
  const prior = metrics?.priorPeriodGrowthPct ?? current;
  if (current > prior + 5) return "heating";
  if (current < prior - 5) return "cooling";
  return "stable";
}

export function computeRiskScore(candidate: Candidate): number {
  let risk = 30;
  const deep = candidate.deepAnalysis;
  if (deep?.riskFactors?.length) risk += deep.riskFactors.length * 8;
  if (deep?.whaleActivity && deep.whaleActivity > 40) risk += 15;
  if (deep?.retention && deep.retention < 20) risk += 20;
  const onchain = candidate.onchainMetrics;
  if (
    onchain &&
    (onchain.txChangePct ?? 0) > 30 &&
    (onchain.activeAddressesChangePct ?? 0) < 5
  ) {
    risk += 25;
  }
  return toScore(risk);
}

export function computeFlags(candidate: Candidate): string[] {
  const flags: string[] = [];
  const onchain = candidate.onchainMetrics;
  const seo = candidate.seoMetrics;
  if (onchain && seo) {
    const onchainAvg =
      ((onchain.tvlChangePct ?? 0) + (onchain.activeAddressesChangePct ?? 0)) / 2;
    if (onchainAvg > 20 && (seo.searchDemandChangePct ?? 0) < 10) {
      flags.push("onchain_web_divergence");
    }
    if ((onchain.txChangePct ?? 0) > 30 && (onchain.activeAddressesChangePct ?? 0) < 5) {
      flags.push("sybil_suspect");
    }
    if ((onchain.tvlChangePct ?? 0) > 30 && (deepRetention(candidate) < 20)) {
      flags.push("whale_driven");
    }
    if (onchainAvg > 25 && (seo.organicVisibility ?? 100) < 30) {
      flags.push("under_marketed_gem");
    }
  }
  return flags;
}

function deepRetention(candidate: Candidate): number {
  return candidate.deepAnalysis?.retention ?? 50;
}
