import type { Candidate, CandidateScore, ScoreBreakdown } from "@scout/schemas";
import { scoreOnchainGrowth, scoreUserGrowth, DIMENSION_WEIGHTS } from "./dimensions/onchain.js";
import {
  scoreSearchDemand,
  scoreCompetitiveGap,
  scoreSeoOpportunity,
  buildGapSignal,
} from "./dimensions/seo.js";
import {
  scoreEvidenceConfidence,
  computeMomentum,
  computeRiskScore,
  computeFlags,
} from "./dimensions/confidence.js";
import { SCORE_CUTOFFS, toScore, formatScorePoints } from "./util.js";

export const DISCLAIMER =
  "Scout's research score based on the configured evidence model.";

export interface ScoringContext {
  graphEvidenceId: string;
  seoEvidenceId: string;
  paidEvidenceId?: string;
  sourceCount: number;
}

function composite(dimensions: { score: number; weight: number }[]): number {
  const total = dimensions.reduce((sum, d) => sum + d.weight * d.score, 0);
  return toScore(total);
}

export function scoreCandidate(
  candidate: Candidate,
  onchainRankScore: number,
  ctx: ScoringContext,
  hasPaidAnalysis: boolean,
): CandidateScore {
  const graphIds = [ctx.graphEvidenceId];
  const seoIds = [ctx.seoEvidenceId];
  const allIds = [...graphIds, ...seoIds];
  if (ctx.paidEvidenceId) allIds.push(ctx.paidEvidenceId);

  const dimensions = [
    scoreOnchainGrowth(candidate.onchainMetrics, graphIds),
    scoreUserGrowth(candidate.onchainMetrics, graphIds),
    scoreSearchDemand(candidate.seoMetrics, seoIds),
    scoreCompetitiveGap(
      candidate.onchainMetrics,
      candidate.seoMetrics,
      onchainRankScore,
      [...graphIds, ...seoIds],
    ),
    scoreSeoOpportunity(candidate.seoMetrics, candidate.onchainMetrics, seoIds),
    scoreEvidenceConfidence(candidate, ctx.sourceCount, hasPaidAnalysis, allIds),
  ];

  const opportunityScore = composite(dimensions);
  const riskScore = computeRiskScore(candidate);
  const momentum = computeMomentum(candidate.onchainMetrics);
  const gapSignal = buildGapSignal(candidate.onchainMetrics, candidate.seoMetrics);
  const flags = computeFlags(candidate);

  const bandLow = toScore(Math.max(0, opportunityScore - 2));
  const bandHigh = toScore(Math.min(100, opportunityScore + 2));

  return {
    protocol: candidate.protocol,
    chain: candidate.chain,
    assetSymbol: candidate.assetSymbol,
    sourceProtocol: candidate.sourceProtocol,
    windowLabel: candidate.windowLabel,
    dimensions,
    composite: opportunityScore,
    opportunityScore,
    riskScore,
    rank: 0,
    momentum,
    gapSignal,
    flags,
    sensitivityBand: [bandLow, bandHigh],
  };
}

export function rankCandidates(scores: CandidateScore[]): CandidateScore[] {
  const sorted = [...scores].sort((a, b) => b.composite - a.composite);
  return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
}

export function buildScoreBreakdown(scores: CandidateScore[]): ScoreBreakdown {
  const ranked = rankCandidates(scores);
  const winner = ranked[0];
  const confidenceDim = winner?.dimensions.find((d) => d.key === "evidenceConfidence");
  return {
    modelVersion: "scout-v1",
    disclaimer: DISCLAIMER,
    candidates: ranked,
    winner: winner?.protocol ?? "",
    confidence: confidenceDim?.score ?? 0,
  };
}

export interface UncertaintyGateResult {
  shouldPay: boolean;
  reason: string;
  expectedConfidenceGain: number;
}

export function evaluateUncertaintyGate(
  scores: CandidateScore[],
  budgetRemaining: number,
  servicePrice: number,
  alreadyPaidFor: Set<string>,
): UncertaintyGateResult {
  const ranked = rankCandidates(scores);
  if (ranked.length < 2) {
    return { shouldPay: false, reason: "Fewer than 2 candidates", expectedConfidenceGain: 0 };
  }
  const [first, second] = ranked;
  const gap = first.composite - second.composite;
  const confidence = first.dimensions.find((d) => d.key === "evidenceConfidence")?.score ?? 0;

  if (budgetRemaining < servicePrice) {
    return { shouldPay: false, reason: "Budget insufficient", expectedConfidenceGain: 0 };
  }
  if (alreadyPaidFor.has(first.protocol) || alreadyPaidFor.has(second.protocol)) {
    return { shouldPay: false, reason: "Deep analysis already purchased", expectedConfidenceGain: 0 };
  }
  if (gap > SCORE_CUTOFFS.clearWinnerGap && confidence >= SCORE_CUTOFFS.clearWinnerConfidence) {
    return {
      shouldPay: false,
      reason: `Clear winner (${formatScorePoints(gap)}pt lead, confidence ${formatScorePoints(confidence)})`,
      expectedConfidenceGain: 0,
    };
  }
  if (gap <= SCORE_CUTOFFS.uncertainGap || confidence < SCORE_CUTOFFS.uncertainConfidence) {
    return {
      shouldPay: true,
      reason: `Resolve uncertainty between ${first.protocol} and ${second.protocol} (${formatScorePoints(gap)}pt gap, confidence ${formatScorePoints(confidence)})`,
      expectedConfidenceGain: Math.min(
        20,
        SCORE_CUTOFFS.uncertainConfidence - confidence + SCORE_CUTOFFS.uncertainGap,
      ),
    };
  }
  return { shouldPay: false, reason: "Sufficient confidence", expectedConfidenceGain: 0 };
}

export { DIMENSION_WEIGHTS };
export { SCORE_CUTOFFS, toScore, formatScorePoints } from "./util.js";
export type { CandidateScore, ScoreBreakdown } from "@scout/schemas";
