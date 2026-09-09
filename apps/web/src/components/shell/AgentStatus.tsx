"use client";

import type { ResearchSession } from "@scout/schemas";
import {
  agentStateMessage,
  deriveUIState,
  toAgentDisplayState,
} from "@/lib/researchStateMachine";
import type { DecisionLogEntry } from "@scout/schemas";

export function AgentStatus({
  session,
  lastLog,
  compact,
}: {
  session: ResearchSession | null;
  lastLog?: DecisionLogEntry;
  compact?: boolean;
}) {
  const uiState = deriveUIState(session, lastLog);
  const displayState = toAgentDisplayState(uiState);
  const message = agentStateMessage(displayState, session);
  const isLive = session?.status === "running";

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs">
        <span className={`h-2 w-2 rounded-full ${isLive ? "bg-signal animate-pulse" : "bg-success"}`} />
        {isLive ? "LIVE" : "ONLINE"}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-signal animate-pulse" : "bg-success"}`} />
        <span className="font-display text-xs uppercase tracking-widest">
          {displayState}
        </span>
      </div>
      <p className="text-sm text-ink/70 max-w-xs">{message}</p>
    </div>
  );
}
