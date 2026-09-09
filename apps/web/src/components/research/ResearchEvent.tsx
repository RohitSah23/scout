"use client";

import { useState } from "react";
import type { DecisionLogEntry } from "@scout/schemas";
import { ToolBadge } from "@/components/ui/Badge";

const EVENT_LABELS: Record<string, { title: string; tool?: string }> = {
  "graph.discovery": { title: "The Graph", tool: "graph" },
  "graph.query": { title: "The Graph", tool: "graph" },
  "graph.complete": { title: "On-chain Analysis", tool: "graph" },
  "openseo.started": { title: "OpenSEO", tool: "openseo" },
  "openseo.complete": { title: "OpenSEO", tool: "openseo" },
  "candidates.updated": { title: "Candidate Shortlist" },
  "scores.provisional": { title: "Scoring" },
  "uncertainty.detected": { title: "Uncertainty" },
  "payment.required": { title: "Payment Required", tool: "x402" },
  "payment.settled": { title: "Payment Settled", tool: "x402" },
  "deep_analysis.received": { title: "Deep Analysis", tool: "x402" },
  "mission.received": { title: "Mission Received" },
  "plan.created": { title: "Research Plan" },
  "recommendation.generated": { title: "Decision" },
  "ens.updated": { title: "ENS", tool: "ens" },
  "research.completed": { title: "Research Complete" },
};

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export function ResearchEvent({
  entry,
  onViewEvidence,
}: {
  entry: DecisionLogEntry;
  onViewEvidence?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = entry.eventType ? EVENT_LABELS[entry.eventType] : null;
  const title = meta?.title ?? "Scout";
  const payload = entry.payload ?? {};

  return (
    <div className="border-l-[3px] border-ink pl-6 py-4 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs text-ink/50">{formatTime(entry.timestamp)}</span>
        {meta?.tool && <ToolBadge tool={meta.tool} />}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-left w-full group"
        aria-expanded={expanded}
      >
        <p className="font-display text-sm uppercase tracking-wide">{title}</p>
        <p className={`text-sm mt-1 ${entry.level === "payment" ? "text-signal" : entry.level === "success" ? "text-success" : entry.level === "warn" ? "text-warning" : "text-ink/80"}`}>
          {entry.message}
        </p>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 font-mono text-xs bg-paper-muted p-4 border border-ink/20">
          {Object.entries(payload).map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="text-ink/50 uppercase">{key}:</span>
              <span>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
            </div>
          ))}
          {onViewEvidence && (
            <button
              type="button"
              onClick={onViewEvidence}
              className="mt-2 font-display text-xs uppercase text-signal hover:underline"
            >
              View Raw Evidence
            </button>
          )}
        </div>
      )}
    </div>
  );
}
