import type { DecisionLogEntry, ResearchEventType, ResearchSession } from "@scout/schemas";

export type ResearchUIState =
  | "idle"
  | "planning"
  | "discovering"
  | "querying"
  | "analyzing"
  | "comparing"
  | "uncertain"
  | "payment_required"
  | "payment_pending"
  | "payment_settled"
  | "research_resumed"
  | "deciding"
  | "complete"
  | "error";

export type AgentDisplayState =
  | "THINKING"
  | "SEARCHING"
  | "ANALYZING"
  | "COMPARING"
  | "UNCERTAIN"
  | "PURCHASING"
  | "VERIFYING"
  | "DECIDING"
  | "COMPLETE";

const EVENT_TO_UI: Partial<Record<ResearchEventType, ResearchUIState>> = {
  "mission.received": "planning",
  "plan.created": "planning",
  "graph.discovery": "discovering",
  "graph.query": "querying",
  "graph.complete": "analyzing",
  "openseo.started": "analyzing",
  "openseo.complete": "comparing",
  "candidates.updated": "comparing",
  "scores.provisional": "comparing",
  "uncertainty.detected": "uncertain",
  "payment.required": "payment_required",
  "payment.pending": "payment_pending",
  "payment.settled": "payment_settled",
  "deep_analysis.received": "research_resumed",
  "recommendation.generated": "deciding",
  "research.completed": "complete",
  "research.failed": "error",
};

const UI_TO_AGENT: Record<ResearchUIState, AgentDisplayState> = {
  idle: "THINKING",
  planning: "THINKING",
  discovering: "SEARCHING",
  querying: "SEARCHING",
  analyzing: "ANALYZING",
  comparing: "COMPARING",
  uncertain: "UNCERTAIN",
  payment_required: "PURCHASING",
  payment_pending: "PURCHASING",
  payment_settled: "VERIFYING",
  research_resumed: "VERIFYING",
  complete: "COMPLETE",
  error: "THINKING",
  deciding: "DECIDING",
};

export function deriveUIState(
  session: ResearchSession | null,
  lastEvent?: DecisionLogEntry,
): ResearchUIState {
  if (!session) return "idle";
  if (session.status === "failed") return "error";
  if (session.status === "completed") return "complete";
  if (session.status === "awaiting_payment") return "payment_required";

  if (lastEvent?.eventType && EVENT_TO_UI[lastEvent.eventType]) {
    return EVENT_TO_UI[lastEvent.eventType]!;
  }

  if (lastEvent?.message) {
    const msg = lastEvent.message.toLowerCase();
    if (msg.includes("graph") && msg.includes("discovery")) return "discovering";
    if (msg.includes("openseo")) return "analyzing";
    if (msg.includes("payment")) return "payment_pending";
    if (msg.includes("recommendation")) return "deciding";
  }

  return session.status === "running" ? "analyzing" : "idle";
}

export function toAgentDisplayState(uiState: ResearchUIState): AgentDisplayState {
  return UI_TO_AGENT[uiState] ?? "THINKING";
}

export function agentStateMessage(
  state: AgentDisplayState,
  session: ResearchSession | null,
): string {
  const count = session?.candidates.length ?? 0;
  const scoredCount = session?.scoreBreakdown?.candidates.length ?? 0;

  switch (state) {
    case "SEARCHING":
      return "Discovering relevant subgraph deployments.";
    case "ANALYZING":
      return count > 0
        ? `Analyzing on-chain activity across ${count} candidates.`
        : "Inspecting live on-chain data.";
    case "COMPARING":
      return scoredCount > 0
        ? `Comparing ${scoredCount} candidates.`
        : count > 0
          ? `Comparing ${count} candidates.`
          : "Normalizing and comparing candidate signals.";
    case "UNCERTAIN":
      return "Top candidates are too close to separate confidently.";
    case "PURCHASING":
      return "Evaluating whether additional evidence is worth purchasing.";
    case "VERIFYING":
      return "Incorporating new evidence into the ranking.";
    case "DECIDING":
      return "Generating final recommendation.";
    case "COMPLETE":
      return session?.recommendation?.winner
        ? `Decision: ${session.recommendation.winner}.`
        : "Research complete.";
    default:
      return "Understanding the research objective.";
  }
}

export const DIMENSION_LABELS: Record<string, string> = {
  onchainGrowth: "On-chain Growth",
  userGrowth: "User Growth",
  searchDemand: "Market/Search Demand",
  competitiveGap: "Competitive Gap",
  seoOpportunity: "Web/SEO Opportunity",
  evidenceConfidence: "Evidence Confidence",
};
