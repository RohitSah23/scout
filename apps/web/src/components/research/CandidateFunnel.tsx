"use client";

import type { ResearchSession } from "@scout/schemas";
import { getDiscoverySummary } from "@/lib/discoverySummary";

export function CandidateFunnel({ session }: { session: ResearchSession | null }) {
  const summary = getDiscoverySummary(session);
  const scored = session?.scoreBreakdown?.candidates.length ?? 0;
  const hasDecision = session?.status === "completed";

  const stages = [
    ...(summary && summary.discoveredCount > 0
      ? [{ label: "discovered", value: summary.discoveredCount }]
      : []),
    ...(summary && summary.liveCount > 0 ? [{ label: "live", value: summary.liveCount }] : []),
    ...(scored > 0 ? [{ label: "scored", value: scored }] : []),
    ...(hasDecision ? [{ label: "decision", value: 1 }] : []),
  ].filter((stage) => stage.value > 0);

  if (stages.length === 0) return null;

  return (
    <div className="border-brutal p-6 space-y-4">
      <p className="font-display text-xs uppercase tracking-widest text-ink/60">Funnel</p>
      <div className="flex items-end gap-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col items-center gap-2">
            <span className="font-mono text-3xl md:text-4xl font-bold tabular-nums">
              {stage.value}
            </span>
            <span className="font-mono text-xs uppercase text-ink/50">{stage.label}</span>
            {i < stages.length - 1 && (
              <span className="hidden md:block absolute" aria-hidden>↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
