"use client";

import type { DecisionLogEntry } from "@scout/schemas";
import { ResearchEvent } from "./ResearchEvent";

export function ResearchTimeline({
  entries,
  loading,
  onViewEvidence,
}: {
  entries: DecisionLogEntry[];
  loading?: boolean;
  onViewEvidence?: () => void;
}) {
  const meaningful = entries.filter(
    (e) => e.eventType || e.level !== "info" || entries.indexOf(e) < 3,
  );

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h2 className="font-display text-2xl uppercase tracking-wide">Scout Is Investigating</h2>
        <div className="h-[3px] w-24 bg-signal mt-2" />
      </div>

      {meaningful.length === 0 && loading && (
        <p className="font-mono text-sm text-ink/50 animate-pulse">Discovering subgraphs…</p>
      )}

      {meaningful.map((entry, i) => (
        <ResearchEvent
          key={`${entry.timestamp}-${i}`}
          entry={entry}
          onViewEvidence={onViewEvidence}
        />
      ))}
    </div>
  );
}
