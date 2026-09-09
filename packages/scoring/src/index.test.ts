import { describe, it, expect } from "vitest";
import {
  buildScoreBreakdown,
  evaluateUncertaintyGate,
  scoreCandidate,
  type ScoringContext,
} from "./index.js";
import type { Candidate } from "@scout/schemas";

const ctx: ScoringContext = {
  graphEvidenceId: "graph-1",
  seoEvidenceId: "seo-1",
  sourceCount: 2,
};

const candidateA: Candidate = {
  id: "a",
  protocol: "Protocol A",
  chain: "base",
  onchainMetrics: {
    tvlChangePct: 42,
    volumeChangePct: 31,
    txChangePct: 55,
    activeAddressesChangePct: 42,
    newUsersChangePct: 35,
  },
  seoMetrics: {
    searchDemandChangePct: 8,
    organicVisibility: 25,
    contentGapScore: 90,
    competitorSerpDominance: 70,
    developerIntentScore: 60,
  },
};

const candidateC: Candidate = {
  id: "c",
  protocol: "Protocol C",
  chain: "base",
  onchainMetrics: {
    tvlChangePct: 38,
    volumeChangePct: 28,
    txChangePct: 48,
    activeAddressesChangePct: 40,
    newUsersChangePct: 32,
  },
  seoMetrics: {
    searchDemandChangePct: 10,
    organicVisibility: 30,
    contentGapScore: 85,
    competitorSerpDominance: 65,
    developerIntentScore: 55,
  },
};

describe("scoring", () => {
  it("computes composite near spec example range", () => {
    const score = scoreCandidate(candidateA, 90, ctx, false);
    expect(score.composite).toBeGreaterThan(60);
    expect(score.composite).toBeLessThanOrEqual(100);
  });

  it("triggers uncertainty gate when top 2 within cutoff gap", () => {
    const sa = scoreCandidate(candidateA, 90, ctx, false);
    const sc = scoreCandidate(candidateC, 85, ctx, false);
    const gate = evaluateUncertaintyGate([sa, sc], 0.5, 0.03, new Set());
    expect(gate.shouldPay).toBe(true);
  });

  it("does not trigger gate for clear winner", () => {
    const sa = scoreCandidate(candidateA, 95, ctx, false);
    const weak: Candidate = {
      ...candidateC,
      protocol: "Weak",
      onchainMetrics: { tvlChangePct: 5, volumeChangePct: 3, txChangePct: 2 },
    };
    const sw = scoreCandidate(weak, 20, ctx, false);
    const gate = evaluateUncertaintyGate([sa, sw], 0.5, 0.03, new Set());
    expect(gate.shouldPay).toBe(false);
  });

  it("builds score breakdown with winner", () => {
    const sa = scoreCandidate(candidateA, 90, ctx, false);
    const sc = scoreCandidate(candidateC, 85, ctx, false);
    const breakdown = buildScoreBreakdown([sa, sc]);
    expect(breakdown.winner).toBeTruthy();
    expect(breakdown.modelVersion).toBe("scout-v1");
  });
});
