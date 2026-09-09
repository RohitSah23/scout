"use client";

import type { CandidateScore } from "@scout/schemas";
import { formatScore } from "@/lib/formatScore";
import { DIMENSION_LABELS } from "@/lib/researchStateMachine";

export function ScoreBreakdown({
  candidate,
  disclaimer,
}: {
  candidate: CandidateScore;
  disclaimer?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-5xl md:text-6xl font-bold tabular-nums">
          {formatScore(candidate.composite)}
          <span className="text-2xl text-ink/40">/100</span>
        </p>
        <p className="font-display text-xs uppercase tracking-widest mt-2 text-ink/60">
          Scout Research Score
        </p>
      </div>

      <div className="space-y-4">
        {candidate.dimensions.map((d) => (
          <div key={d.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{DIMENSION_LABELS[d.key] ?? d.key}</span>
              <span className="font-mono tabular-nums">{formatScore(d.score)}</span>
            </div>
            <div className="h-2 bg-paper-muted border border-ink/20">
              <div
                className="h-full bg-ink transition-all duration-500"
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {disclaimer && (
        <p className="text-xs text-ink/50 italic">{disclaimer}</p>
      )}
    </div>
  );
}
