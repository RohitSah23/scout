import { randomUUID } from "node:crypto";
import type {
  Budget,
  DecisionLogEntry,
  ResearchEventType,
  ResearchSession,
  Source,
} from "@scout/schemas";
import { GraphProvider } from "@scout/graph";
import { OpenSEOProvider, neutralSeoMetrics } from "@scout/openseo";
import {
  buildScoreBreakdown,
  evaluateUncertaintyGate,
  scoreCandidate,
  type CandidateScore,
  type ScoringContext,
} from "@scout/scoring";
import { narrateRecommendation, toRecommendation } from "@scout/llm";
import { DEEP_ANALYSIS_PRICE_USD, type DeepAnalysisResult } from "@scout/deep-analysis";
import { createENSIdentity } from "@scout/ens";
import { createDefaultPolicy, PrivyX402PaymentProvider } from "@scout/privy";

export type LogCallback = (entry: DecisionLogEntry) => void;
export type SessionUpdateCallback = (session: ResearchSession) => void;

export interface RunResearchOptions {
  researchId?: string;
  request: string;
  budget?: number;
  chain?: string;
  category?: string;
  graphApiKey?: string;
  openseoApiKey?: string;
  openseoProjectId?: string;
  payToAddresses?: string[];
  deepAnalysisUrl?: string;
  privyAppId?: string;
  privyAppSecret?: string;
  privyWalletId?: string;
  privyPolicyId?: string;
  onLog?: LogCallback;
  onSessionUpdate?: SessionUpdateCallback;
}

interface ResearchRuntime {
  onLog: LogCallback;
  onSessionUpdate?: SessionUpdateCallback;
  decisionLog: DecisionLogEntry[];
}

function emit(
  runtime: ResearchRuntime,
  message: string,
  level: DecisionLogEntry["level"] = "info",
  eventType?: ResearchEventType,
  payload?: Record<string, unknown>,
) {
  const entry: DecisionLogEntry = {
    timestamp: new Date().toISOString(),
    message,
    level,
    eventType,
    payload,
  };
  runtime.decisionLog.push(entry);
  runtime.onLog(entry);
}

function touchSession(session: ResearchSession, runtime: ResearchRuntime) {
  session.updatedAt = new Date().toISOString();
  session.decisionLog = [...runtime.decisionLog];
  runtime.onSessionUpdate?.(session);
}

function scoringContextFor(
  session: ResearchSession,
  candidate: ResearchSession["candidates"][number],
  extras?: Partial<ScoringContext>,
): ScoringContext {
  return {
    graphEvidenceId: candidate.id,
    seoEvidenceId: `openseo-${candidate.protocol.toLowerCase().replace(/\s+/g, "-")}-${candidate.chain}`,
    sourceCount: session.sources.length,
    ...extras,
  };
}

function createRuntime(
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate">,
  decisionLog: DecisionLogEntry[] = [],
): ResearchRuntime {
  const onLog = (entry: DecisionLogEntry) => opts.onLog?.(entry);
  return { onLog, onSessionUpdate: opts.onSessionUpdate, decisionLog };
}

export async function runResearch(opts: RunResearchOptions): Promise<ResearchSession> {
  const researchId = opts.researchId ?? randomUUID();
  const now = new Date().toISOString();
  const budget: Budget = {
    initial: opts.budget ?? 0.5,
    spent: 0,
    remaining: opts.budget ?? 0.5,
    currency: "USDC",
    perRequestCap: 0.1,
  };

  const decisionLog: DecisionLogEntry[] = [];
  const runtime = createRuntime(opts, decisionLog);

  const session: ResearchSession = {
    researchId,
    status: "running",
    request: opts.request,
    chain: opts.chain ?? "base",
    category: opts.category ?? "lending",
    researchMode: "tokens",
    agent: { name: "scout" },
    budget,
    sources: [],
    candidates: [],
    decisionLog,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (!opts.graphApiKey) {
      throw new Error("GRAPH_GATEWAY_API_KEY is required for live on-chain data.");
    }
    if (!opts.openseoApiKey) {
      throw new Error("OPENSEO_API_KEY is required for live web/SEO data.");
    }

    emit(runtime, "Mission received.", "info", "mission.received", { request: opts.request });
    emit(runtime, "Research plan created.", "info", "plan.created", {
      categories: ["on-chain activity", "user growth", "liquidity", "search demand", "competition"],
    });

    const graph = new GraphProvider(opts.graphApiKey);
    emit(runtime, "Graph Subgraph discovery started.", "info", "graph.discovery");
    const graphResult = await graph.execute({ action: "query-all", chain: opts.chain ?? "base" }) as {
      candidates: ResearchSession["candidates"];
      sources: Source[];
      queryTemplate: string;
      protocolCount: number;
      tokenCount: number;
      discoveredCount: number;
      messariProtocolCount: number;
      composable: boolean;
      schemaStandard: string;
      skipped: string[];
    };

    emit(
      runtime,
      `Queried ${graphResult.discoveredCount} lending subgraphs on ${opts.chain ?? "base"} — ${graphResult.protocolCount} protocols returned live data, ${graphResult.tokenCount} lending assets ranked (${graphResult.messariProtocolCount} Messari-composable).`,
      "info",
      "graph.query",
      {
        protocolCount: graphResult.protocolCount,
        tokenCount: graphResult.tokenCount,
        discoveredCount: graphResult.discoveredCount,
        messariProtocolCount: graphResult.messariProtocolCount,
        queryTemplate: graphResult.queryTemplate,
        composable: graphResult.composable,
        schemaStandard: graphResult.schemaStandard,
        skipped: graphResult.skipped,
      },
    );
    emit(
      runtime,
      `Composable query — 1 Messari template × ${graphResult.messariProtocolCount} protocols, top 5 assets each${graphResult.protocolCount > graphResult.messariProtocolCount ? ` (+ native adapters)` : ""}.`,
      "info",
      "graph.complete",
      {
        deployments: graphResult.protocolCount,
        tokenCount: graphResult.tokenCount,
        messariProtocolCount: graphResult.messariProtocolCount,
        composable: graphResult.composable,
        schemaStandard: graphResult.schemaStandard,
        skipped: graphResult.skipped,
        evidence: ["market TVL", "deposit/borrow flow", "1h trending events", "token-level growth"],
      },
    );

    session.sources.push(...graphResult.sources);
    let candidates = graphResult.candidates;
    emit(
      runtime,
      `${graphResult.tokenCount} lending assets ranked across ${graphResult.protocolCount} protocols (${graphResult.skipped.length} skipped).`,
      "info",
      "candidates.updated",
      {
        count: candidates.length,
        tokenCount: graphResult.tokenCount,
        protocolCount: graphResult.protocolCount,
        discoveredCount: graphResult.discoveredCount,
        skippedCount: graphResult.skipped.length,
        skipped: graphResult.skipped,
        stage: "discovered",
      },
    );
    session.candidates = candidates;
    touchSession(session, runtime);

    const openseo = new OpenSEOProvider(opts.openseoApiKey, opts.openseoProjectId);
    emit(runtime, "OpenSEO keyword analysis started.", "info", "openseo.started");
    let sparseSeo: string[] = [];
    try {
      const seoResult = await openseo.execute({ action: "enrich-candidates", candidates }) as {
        candidates: ResearchSession["candidates"];
        sources: Source[];
        sparse?: string[];
        unavailable?: boolean;
      };
      candidates = seoResult.candidates;
      session.sources.push(...seoResult.sources);
      session.candidates = candidates;
      sparseSeo = seoResult.sparse ?? [];
      emit(
        runtime,
        seoResult.unavailable
          ? `OpenSEO unavailable (${sparseSeo.length} candidates scored with neutral SEO baseline). Research continues with on-chain data.`
          : sparseSeo.length > 0
            ? `OpenSEO complete — ${sparseSeo.length} protocol(s) had sparse keyword data (${sparseSeo.slice(0, 3).join(", ")}${sparseSeo.length > 3 ? "…" : ""}); scored with neutral SEO baseline.`
            : "OpenSEO web intelligence complete.",
        seoResult.unavailable || sparseSeo.length > 0 ? "warn" : "info",
        "openseo.complete",
        {
          evidence: ["search demand", "organic visibility", "content gap", "competition"],
          sparse: sparseSeo,
          unavailable: seoResult.unavailable ?? false,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      sparseSeo = candidates.map((c) => c.protocol);
      emit(
        runtime,
        `OpenSEO failed (${message}). Continuing with on-chain evidence and neutral SEO baseline.`,
        "warn",
        "openseo.complete",
        { sparse: sparseSeo, unavailable: true, error: message },
      );
      session.candidates = candidates.map((c) => ({ ...c, seoMetrics: neutralSeoMetrics() }));
      candidates = session.candidates;
    }
    touchSession(session, runtime);

    const onchainRanks = candidates.map((c) => {
      const tm = c.tokenMetrics;
      if (tm?.trendingScore && tm.trendingScore > 0) return tm.trendingScore;
      if (tm?.grossFlowUsd && tm.grossFlowUsd > 0) return tm.grossFlowUsd;
      const m = c.onchainMetrics;
      return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
    });
    const maxRank = Math.max(...onchainRanks, 1);

    const scores = candidates.map((c, i) =>
      scoreCandidate(c, (onchainRanks[i] / maxRank) * 100, scoringContextFor(session, c), false),
    );

    const provisional = buildScoreBreakdown(scores);
    session.scoreBreakdown = provisional;
    session.confidence = provisional.confidence;
    emit(runtime, `${provisional.candidates.length} candidates scored.`, "info", "scores.provisional", {
      candidates: provisional.candidates.map((c) => ({
        protocol: c.protocol,
        composite: c.composite,
        rank: c.rank,
      })),
      confidence: provisional.confidence,
    });
    touchSession(session, runtime);

    // Uncertainty Gate Evaluation
    const gate = evaluateUncertaintyGate(
      scores,
      session.budget.remaining,
      DEEP_ANALYSIS_PRICE_USD,
      new Set(),
    );

    if (gate.shouldPay) {
      const top2 = provisional.candidates.slice(0, 2);
      emit(
        runtime,
        `Uncertainty detected: ${gate.reason}. High-conviction decision requires candidate-specific diagnostics.`,
        "warn",
        "uncertainty.detected",
        {
          gap: top2.length >= 2 ? Math.round((top2[0].composite - top2[1].composite) * 10) / 10 : 0,
          confidence: provisional.confidence,
          candidates: top2.map((t) => t.protocol),
        },
      );

      session.status = "awaiting_payment";
      session.paymentPending = {
        amount: DEEP_ANALYSIS_PRICE_USD,
        reason: gate.reason,
        targetProtocols: [top2[0].protocol, top2[1]?.protocol ?? top2[0].protocol],
        confidence: provisional.confidence,
        budgetBefore: session.budget.remaining,
        budgetAfter: Math.round((session.budget.remaining - DEEP_ANALYSIS_PRICE_USD) * 100) / 100,
        serviceName: "Candidate-specific protocol diagnostics",
      };

      emit(
        runtime,
        `Payment authorization required: $${DEEP_ANALYSIS_PRICE_USD.toFixed(2)} USDC for deep analysis report on ${top2[0].protocol}.`,
        "payment",
        "payment.required",
        {
          paymentPending: session.paymentPending,
        },
      );

      touchSession(session, runtime);
      return session;
    }

    return await finalizeResearch(session, runtime, candidates, scores);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed";
    const stage = [...runtime.decisionLog].reverse().find((e) => e.eventType)?.eventType;
    const hint =
      /fetch failed|ECONNRESET|ETIMEDOUT/i.test(message) && stage === "openseo.started"
        ? " (OpenSEO API network error — retry in a moment)"
        : /fetch failed|ECONNRESET|ETIMEDOUT/i.test(message) && stage === "graph.discovery"
          ? " (The Graph gateway network error — retry in a moment)"
          : "";
    emit(runtime, `Research failed: ${message}${hint}`, "warn", "research.failed", {
      error: message,
      stage,
    });
    session.status = "failed";
    touchSession(session, runtime);
    throw err;
  }
}

export async function runResearchPhase1(opts: RunResearchOptions): Promise<ResearchSession> {
  return runResearch(opts);
}

export async function authorizePaymentAndComplete(
  session: ResearchSession,
  opts: Pick<
    RunResearchOptions,
    | "onLog"
    | "onSessionUpdate"
    | "payToAddresses"
    | "deepAnalysisUrl"
    | "privyAppId"
    | "privyAppSecret"
    | "privyWalletId"
    | "privyPolicyId"
  >,
): Promise<ResearchSession> {
  const runtime = createRuntime(opts, [...session.decisionLog]);
  emit(
    runtime,
    `Authorizing payment of $${DEEP_ANALYSIS_PRICE_USD.toFixed(2)} USDC via Privy policy…`,
    "payment",
    "payment.pending",
  );

  const recipients = opts.payToAddresses ?? [];
  const recipient = recipients[0];
  if (!recipient) throw new Error("X402_PAY_TO_ADDRESS is required");
  if (!opts.deepAnalysisUrl) throw new Error("DEEP_ANALYSIS_URL is required");

  const policy = createDefaultPolicy(
    recipients,
    session.budget.initial,
    session.budget.spent,
  );
  const wallet = new PrivyX402PaymentProvider({
    ...policy,
    appId: opts.privyAppId ?? "",
    appSecret: opts.privyAppSecret ?? "",
    walletId: opts.privyWalletId ?? "",
    expectedPolicyId: opts.privyPolicyId ?? "",
  });

  const targetProtocol =
    session.paymentPending?.targetProtocols[0] ?? session.candidates[0]?.protocol;
  const targetCandidate = session.candidates.find((c) => c.protocol === targetProtocol);
  if (!targetProtocol || !targetCandidate) throw new Error("No candidate is available for deep analysis");

  const payResult = await wallet.pay({
    url: opts.deepAnalysisUrl,
    amount: DEEP_ANALYSIS_PRICE_USD,
    recipient,
    reason: session.paymentPending?.reason ?? "Uncertainty gate resolution",
    method: "POST",
    body: { protocol: targetProtocol, candidate: targetCandidate },
  });

  if (!payResult.success) {
    emit(runtime, `Payment denied by policy: ${payResult.error}`, "warn");
    throw new Error(payResult.error ?? "Payment failed");
  }

  const paidData = payResult.data as
    | {
        resource?: DeepAnalysisResult;
        wallet?: { id?: string; address?: string };
        policyId?: string;
      }
    | undefined;
  const payer = paidData?.wallet?.address;
  const policyId = paidData?.policyId;
  const txHash = payResult.txRef;
  if (!payer || !policyId || !txHash) {
    throw new Error("Payment settled without a complete Privy policy receipt");
  }

  session.paymentReceipt = {
    amount: DEEP_ANALYSIS_PRICE_USD,
    currency: "USDC",
    payer,
    payee: recipient,
    policyId,
    network: "Base Sepolia",
    txHash,
    explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
    serviceUrl: opts.deepAnalysisUrl,
    settledAt: new Date().toISOString(),
  };
  session.agent.wallet = payer;

  emit(
    runtime,
    `Payment settled from a policy-controlled Privy wallet (${txHash}).`,
    "success",
    "payment.settled",
    session.paymentReceipt,
  );

  session.budget.spent = Math.round((session.budget.spent + DEEP_ANALYSIS_PRICE_USD) * 100) / 100;
  session.budget.remaining = Math.round((session.budget.initial - session.budget.spent) * 100) / 100;

  const deep = paidData?.resource;
  if (!deep || deep.protocol !== targetProtocol) {
    throw new Error("Paid service returned an invalid deep-analysis payload");
  }

  const paidSourceId = `deep-${targetProtocol.toLowerCase().replace(/\s+/g, "-")}`;
  session.sources.push({
    id: paidSourceId,
    name: "Deep Protocol Analysis",
    type: "paid",
    cost: DEEP_ANALYSIS_PRICE_USD,
    payment: "x402",
    txRef: payResult.txRef,
    data: deep as unknown as Record<string, unknown>,
  });

  session.candidates = session.candidates.map((c) =>
    c.protocol === targetProtocol
      ? {
          ...c,
          deepAnalysis: {
            walletGrowth: deep.wallet_growth,
            retention: deep.retention,
            whaleActivity: deep.whale_activity,
            growthQuality: deep.growth_quality,
            riskFactors: deep.risk_factors,
            confidenceBoost: deep.confidence_boost,
          },
        }
      : c,
  );

  emit(
    runtime,
    `Paid diagnostics received for ${targetProtocol} from ${deep.observed_fields.length} observed fields.`,
    "info",
    "deep_analysis.received",
    {
      protocol: targetProtocol,
      growthQuality: deep.growth_quality,
      confidenceBoost: deep.confidence_boost,
      whaleActivity: deep.whale_activity,
      retention: deep.retention,
      observedFields: deep.observed_fields,
      methodology: deep.methodology,
    },
  );

  const onchainRanks = session.candidates.map((c) => {
    const tm = c.tokenMetrics;
    if (tm?.trendingScore && tm.trendingScore > 0) return tm.trendingScore;
    if (tm?.grossFlowUsd && tm.grossFlowUsd > 0) return tm.grossFlowUsd;
    const m = c.onchainMetrics;
    return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
  });
  const maxRank = Math.max(...onchainRanks, 1);

  const recomputedScores = session.candidates.map((c, i) =>
    scoreCandidate(
      c,
      (onchainRanks[i] / maxRank) * 100,
      scoringContextFor(session, c, {
        paidEvidenceId: paidSourceId,
        sourceCount: session.sources.length,
      }),
      c.protocol === targetProtocol,
    ),
  );

  session.paymentPending = undefined;
  session.status = "running";
  return finalizeResearch(session, runtime, session.candidates, recomputedScores);
}

export async function denyPaymentAndComplete(
  session: ResearchSession,
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate">,
): Promise<ResearchSession> {
  const runtime = createRuntime(opts, [...session.decisionLog]);
  emit(runtime, "Paid deep analysis skipped by user. Proceeding with existing evidence.", "info");

  const candidates = session.candidates;
  const onchainRanks = candidates.map((c) => {
    const tm = c.tokenMetrics;
    if (tm?.trendingScore && tm.trendingScore > 0) return tm.trendingScore;
    if (tm?.grossFlowUsd && tm.grossFlowUsd > 0) return tm.grossFlowUsd;
    const m = c.onchainMetrics;
    return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
  });
  const maxRank = Math.max(...onchainRanks, 1);
  const scores = candidates.map((c, i) =>
    scoreCandidate(c, (onchainRanks[i] / maxRank) * 100, scoringContextFor(session, c), false),
  );
  session.paymentPending = undefined;
  session.status = "running";
  return finalizeResearch(session, runtime, candidates, scores);
}

async function finalizeResearch(
  session: ResearchSession,
  runtime: ResearchRuntime,
  candidates: ResearchSession["candidates"],
  scores: CandidateScore[],
): Promise<ResearchSession> {
  const scoreBreakdown = buildScoreBreakdown(scores);
  const winner = scoreBreakdown.candidates[0];

  emit(runtime, "Generating recommendation narrative via OpenRouter…", "info");
  const narration = await narrateRecommendation({
    userRequest: session.request,
    scoreBreakdown,
    winnerProtocol: winner?.protocol ?? "",
    opportunityScore: winner?.composite ?? 0,
    riskScore: winner?.riskScore ?? 0,
  });

  emit(runtime, "OpenRouter narrative complete.", "success");

  const recommendation = toRecommendation(
    narration,
    winner?.protocol ?? "",
    winner?.composite ?? 0,
    winner?.riskScore ?? 0,
  );

  emit(runtime, "Final recommendation generated.", "success", "recommendation.generated", {
    winner: winner?.protocol,
    score: winner?.composite,
    confidence: scoreBreakdown.confidence,
  });

  // A missing or rejected ENSv2 write is recorded explicitly; no synthetic receipt is emitted.
  try {
    const ens = createENSIdentity(session.chain ?? "base", session.budget.initial);
    const ensWrite = await ens.writeResearchStatus("complete", `report-${session.researchId}`);
    if (!ensWrite.success || !ensWrite.txHash) {
      throw new Error(ensWrite.error ?? "ENSv2 write did not produce a transaction hash");
    }
    const resolvedName = await ens.resolveName();
    session.agent.ensName = resolvedName;
    emit(
      runtime,
      `ENSv2 status record published: ${resolvedName} → research.status=complete (${ensWrite.txHash})`,
      "success",
      "ens.updated",
      {
        ensName: resolvedName,
        status: "complete",
        txHash: ensWrite.txHash,
      },
    );
  } catch (error) {
    emit(
      runtime,
      `ENSv2 status was not published: ${error instanceof Error ? error.message : "write failed"}`,
      "warn",
      "ens.failed",
    );
  }

  session.candidates = candidates;
  session.scoreBreakdown = scoreBreakdown;
  session.recommendation = recommendation;
  session.confidence = scoreBreakdown.confidence;
  session.status = "completed";
  session.paymentPending = undefined;
  emit(runtime, "Research complete.", "success", "research.completed", {
    winner: winner?.protocol,
    score: winner?.composite,
    confidence: scoreBreakdown.confidence,
  });
  touchSession(session, runtime);
  return session;
}

export { GraphProvider, OpenSEOProvider };
