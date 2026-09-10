import { randomUUID } from "node:crypto";
import type {
  Budget,
  DecisionLogEntry,
  ResearchEventType,
  ResearchSession,
  Source,
} from "@scout/schemas";
import { GraphProvider } from "@scout/graph";
import { OpenSEOProvider } from "@scout/openseo";
import {
  buildScoreBreakdown,
  evaluateUncertaintyGate,
  scoreCandidate,
  type CandidateScore,
  type ScoringContext,
} from "@scout/scoring";
import { narrateRecommendation, toRecommendation } from "@scout/llm";
import { DEEP_ANALYSIS_PRICE_USD, runDeepAnalysis } from "@scout/deep-analysis";
import { createENSIdentity } from "@scout/ens";
import { createDefaultPolicy, PrivyWalletProvider } from "@scout/privy";

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

function createRuntime(
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate">,
  decisionLog: DecisionLogEntry[] = [],
): ResearchRuntime {
  const onLog = (entry: DecisionLogEntry) => {
    decisionLog.push(entry);
    opts.onLog?.(entry);
  };
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
      messariProtocolCount: number;
      composable: boolean;
      schemaStandard: string;
      skipped: string[];
    };

    emit(
      runtime,
      `Found ${graphResult.protocolCount} lending deployments on ${opts.chain ?? "base"} (${graphResult.messariProtocolCount} Messari-composable).`,
      "info",
      "graph.query",
      {
        protocolCount: graphResult.protocolCount,
        messariProtocolCount: graphResult.messariProtocolCount,
        queryTemplate: graphResult.queryTemplate,
        composable: graphResult.composable,
        schemaStandard: graphResult.schemaStandard,
        skipped: graphResult.skipped,
      },
    );
    emit(
      runtime,
      `Composable query — 1 Messari template × ${graphResult.messariProtocolCount} protocols${graphResult.protocolCount > graphResult.messariProtocolCount ? ` (+ ${graphResult.protocolCount - graphResult.messariProtocolCount} native adapter)` : ""}.`,
      "info",
      "graph.complete",
      {
        deployments: graphResult.protocolCount,
        messariProtocolCount: graphResult.messariProtocolCount,
        composable: graphResult.composable,
        schemaStandard: graphResult.schemaStandard,
        skipped: graphResult.skipped,
        evidence: ["TVL", "deposit/borrow volume", "liquidations", "unique users"],
      },
    );

    session.sources.push(...graphResult.sources);
    let candidates = graphResult.candidates;
    emit(runtime, `Shortlisted ${candidates.length} candidates.`, "info", "candidates.updated", {
      count: candidates.length,
      protocolCount: graphResult.protocolCount,
      stage: "shortlist",
    });
    session.candidates = candidates;
    touchSession(session, runtime);

    const openseo = new OpenSEOProvider(opts.openseoApiKey, opts.openseoProjectId);
    emit(runtime, "OpenSEO keyword analysis started.", "info", "openseo.started");
    const seoResult = await openseo.execute({ action: "enrich-candidates", candidates }) as {
      candidates: ResearchSession["candidates"];
      sources: Source[];
    };
    candidates = seoResult.candidates;
    session.sources.push(...seoResult.sources);
    session.candidates = candidates;
    emit(runtime, "OpenSEO web intelligence complete.", "info", "openseo.complete", {
      evidence: ["search demand", "organic visibility", "content gap", "competition"],
    });
    touchSession(session, runtime);

    const graphEvidenceId = session.sources.find((s) => s.type === "onchain")?.id ?? "graph";
    const seoEvidenceId = session.sources.find((s) => s.type === "web")?.id ?? "seo";
    const ctx: ScoringContext = { graphEvidenceId, seoEvidenceId, sourceCount: 2 };

    const onchainRanks = candidates.map((c) => {
      const m = c.onchainMetrics;
      return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
    });
    const maxRank = Math.max(...onchainRanks, 1);

    const scores = candidates.map((c, i) =>
      scoreCandidate(c, (onchainRanks[i] / maxRank) * 100, ctx, false),
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
        `Uncertainty detected: ${gate.reason}. High-conviction decision requires deep wallet-flow analysis.`,
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
        serviceName: "Deep wallet-flow analysis",
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
    emit(runtime, `Research failed: ${message}`, "warn", "research.failed", { error: message });
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
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate" | "payToAddresses">,
): Promise<ResearchSession> {
  const runtime = createRuntime(opts, [...session.decisionLog]);
  emit(
    runtime,
    `Authorizing payment of $${DEEP_ANALYSIS_PRICE_USD.toFixed(2)} USDC via Privy policy…`,
    "payment",
    "payment.pending",
  );

  const policy = createDefaultPolicy(
    opts.payToAddresses ?? [process.env.X402_PAY_TO_ADDRESS ?? "0xscoutdeepanalysis"],
    session.budget.initial,
  );
  const wallet = new PrivyWalletProvider(policy);

  const payResult = await wallet.signPayment({
    amount: DEEP_ANALYSIS_PRICE_USD,
    recipient: (opts.payToAddresses ?? [process.env.X402_PAY_TO_ADDRESS ?? "0xscoutdeepanalysis"])[0],
    reason: session.paymentPending?.reason ?? "Uncertainty gate resolution",
  });

  if (!payResult.success) {
    emit(runtime, `Payment denied by policy: ${payResult.error}`, "warn");
    throw new Error(payResult.error ?? "Payment failed");
  }

  emit(
    runtime,
    `Payment settled via Privy policy (${payResult.txRef}).`,
    "success",
    "payment.settled",
    {
      amount: DEEP_ANALYSIS_PRICE_USD,
      txRef: payResult.txRef,
    },
  );

  session.budget.spent = Math.round((session.budget.spent + DEEP_ANALYSIS_PRICE_USD) * 100) / 100;
  session.budget.remaining = Math.round((session.budget.initial - session.budget.spent) * 100) / 100;

  const targetProtocol =
    session.paymentPending?.targetProtocols[0] ?? session.candidates[0]?.protocol;
  const targetCandidate = session.candidates.find((c) => c.protocol === targetProtocol);
  const deep = runDeepAnalysis(targetProtocol, targetCandidate);

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
    `Deep analysis received for ${targetProtocol}: whale activity ${deep.whale_activity}%, retention ${deep.retention}%.`,
    "info",
    "deep_analysis.received",
    {
      protocol: targetProtocol,
      growthQuality: deep.growth_quality,
      confidenceBoost: deep.confidence_boost,
      whaleActivity: deep.whale_activity,
      retention: deep.retention,
    },
  );

  const graphEvidenceId = session.sources.find((s) => s.type === "onchain")?.id ?? "graph";
  const seoEvidenceId = session.sources.find((s) => s.type === "web")?.id ?? "seo";
  const ctx: ScoringContext = {
    graphEvidenceId,
    seoEvidenceId,
    paidEvidenceId: paidSourceId,
    sourceCount: 3,
  };

  const onchainRanks = session.candidates.map((c) => {
    const m = c.onchainMetrics;
    return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
  });
  const maxRank = Math.max(...onchainRanks, 1);

  const recomputedScores = session.candidates.map((c, i) =>
    scoreCandidate(
      c,
      (onchainRanks[i] / maxRank) * 100,
      ctx,
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

  const graphEvidenceId = session.sources.find((s) => s.type === "onchain")?.id ?? "graph";
  const seoEvidenceId = session.sources.find((s) => s.type === "web")?.id ?? "seo";
  const ctx: ScoringContext = { graphEvidenceId, seoEvidenceId, sourceCount: 2 };
  const candidates = session.candidates;
  const onchainRanks = candidates.map((c) => {
    const m = c.onchainMetrics;
    return ((m?.tvlChangePct ?? 0) + (m?.activeAddressesChangePct ?? 0)) / 2;
  });
  const maxRank = Math.max(...onchainRanks, 1);
  const scores = candidates.map((c, i) =>
    scoreCandidate(c, (onchainRanks[i] / maxRank) * 100, ctx, false),
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

  // ENSv2 status record write
  const ens = createENSIdentity(session.chain ?? "base", session.budget.initial);
  const ensWrite = await ens.writeResearchStatus("complete", `report-${session.researchId}`);
  if (ensWrite.success) {
    const resolvedName = await ens.resolveName();
    session.agent.ensName = resolvedName;
    emit(
      runtime,
      `ENS status record published: ${resolvedName} → research.status=complete (${ensWrite.txHash})`,
      "success",
      "ens.updated",
      {
        ensName: resolvedName,
        status: "complete",
        txHash: ensWrite.txHash,
      },
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
