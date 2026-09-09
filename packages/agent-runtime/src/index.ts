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
  scoreCandidate,
  type CandidateScore,
  type ScoringContext,
} from "@scout/scoring";
import { narrateRecommendation, toRecommendation } from "@scout/llm";

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
    };

    emit(
      runtime,
      `Found ${graphResult.protocolCount} relevant lending deployments.`,
      "info",
      "graph.query",
      { protocolCount: graphResult.protocolCount, queryTemplate: graphResult.queryTemplate },
    );
    emit(
      runtime,
      `Using standard schema — 1 query × ${graphResult.protocolCount} protocols.`,
      "info",
      "graph.complete",
      {
        deployments: graphResult.protocolCount,
        evidence: ["active users", "transactions", "TVL", "volume"],
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

    return await finalizeResearch(session, runtime, candidates, scores);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed";
    emit(runtime, `Research failed: ${message}`, "warn", "research.failed", { error: message });
    session.status = "failed";
    touchSession(session, runtime);
    throw err;
  }
}

/** @deprecated Payment flow disabled — completes with existing evidence. */
export async function runResearchPhase1(opts: RunResearchOptions): Promise<ResearchSession> {
  return runResearch(opts);
}

/** @deprecated Payment flow disabled. */
export async function authorizePaymentAndComplete(
  session: ResearchSession,
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate">,
): Promise<ResearchSession> {
  return denyPaymentAndComplete(session, opts);
}

/** @deprecated Payment flow disabled. */
export async function denyPaymentAndComplete(
  session: ResearchSession,
  opts: Pick<RunResearchOptions, "onLog" | "onSessionUpdate">,
): Promise<ResearchSession> {
  const runtime = createRuntime(opts, [...session.decisionLog]);
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
