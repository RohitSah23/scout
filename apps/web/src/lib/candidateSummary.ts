import type { Candidate, CandidateScore, OnchainMetrics } from "@scout/schemas";
import { formatScore } from "./formatScore";

export function formatSignedPct(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function onchainAverage(metrics?: OnchainMetrics): number {
  if (!metrics) return 0;
  return (
    ((metrics.tvlChangePct ?? 0) +
      (metrics.volumeChangePct ?? 0) +
      (metrics.activeAddressesChangePct ?? 0)) /
    3
  );
}

export function matchRawCandidate(
  score: CandidateScore,
  rawCandidates?: Candidate[],
): Candidate | undefined {
  return rawCandidates?.find(
    (c) =>
      c.protocol === score.protocol &&
      c.chain.toLowerCase() === score.chain.toLowerCase(),
  );
}

export function candidateInsight(score: CandidateScore, raw?: Candidate): string {
  const onchain = onchainAverage(raw?.onchainMetrics);
  const search = raw?.seoMetrics?.searchDemandChangePct ?? 0;

  if (score.gapSignal) {
    return score.gapSignal
      .replace(/\+\-/g, "-")
      .replace(/but search \+(-)/, "but search $1");
  }

  if (onchain > 20 && search < 15) {
    return `on-chain ${formatSignedPct(onchain)} but search ${formatSignedPct(search)}`;
  }

  return `on-chain ${formatSignedPct(onchain)} · search ${formatSignedPct(search)}`;
}

export function momentumLabel(momentum?: CandidateScore["momentum"]): string | null {
  if (!momentum) return null;
  return momentum === "heating" ? "Heating" : momentum === "cooling" ? "Cooling" : "Stable";
}

export function scoreBandLabel(score: CandidateScore): string | null {
  if (!score.sensitivityBand) return null;
  return `${formatScore(score.sensitivityBand[0])}–${formatScore(score.sensitivityBand[1])}`;
}
