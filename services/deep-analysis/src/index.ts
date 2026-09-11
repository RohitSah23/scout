import type { Candidate } from "@scout/schemas";

export interface DeepAnalysisResult {
  protocol: string;
  wallet_growth?: number;
  retention?: number;
  whale_activity?: number;
  growth_quality: "strong" | "moderate" | "weak";
  risk_factors: string[];
  competitive_pressure: "low" | "medium" | "high";
  developer_opportunity: string;
  confidence_boost: number;
  observed_fields: string[];
  methodology: string;
}

export function runDeepAnalysis(protocol: string, candidate: Candidate): DeepAnalysisResult {
  if (!candidate || candidate.protocol !== protocol || !candidate.onchainMetrics) {
    throw new Error("Candidate-specific on-chain evidence is required for deep analysis");
  }
  const onchain = candidate.onchainMetrics;
  const retention = onchain.returningUserRatio;
  const walletGrowth = onchain.activeAddressesChangePct;
  const observedFields = Object.entries(onchain)
    .filter(([, value]) => typeof value === "number")
    .map(([key]) => key);

  const riskFactors: string[] = [];
  if (retention !== undefined && retention < 25) {
    riskFactors.push("Low returning-user ratio relative to the observed activity window");
  }
  if ((onchain?.txChangePct ?? 0) > 40 && (onchain?.activeAddressesChangePct ?? 0) < 10) {
    riskFactors.push("Transaction growth materially exceeds active-address growth");
  }
  if ((onchain.tvlChangePct ?? 0) > 25 && (onchain.volumeChangePct ?? 0) < 0) {
    riskFactors.push("TVL growth is not accompanied by volume growth");
  }

  const growthQuality =
    retention !== undefined && retention > 28 && (walletGrowth ?? 0) > 0
      ? "strong"
      : retention !== undefined && retention > 20
        ? "moderate"
        : "weak";
  const confidenceBoost = Math.min(0.15, observedFields.length * 0.02);

  return {
    protocol,
    wallet_growth: walletGrowth,
    retention,
    growth_quality: growthQuality,
    risk_factors: riskFactors,
    competitive_pressure: (candidate?.seoMetrics?.competitorSerpDominance ?? 50) > 70 ? "high" : "medium",
    developer_opportunity: `Validate integration demand around ${protocol} against its observed on-chain and search evidence`,
    confidence_boost: confidenceBoost,
    observed_fields: observedFields,
    methodology:
      "Deterministic diagnostics over the candidate evidence submitted to this endpoint; unavailable metrics remain omitted.",
  };
}

export const DEEP_ANALYSIS_PRICE_USD = 0.03;
