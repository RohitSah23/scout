"use client";

import type { CandidateScore } from "@scout/schemas";
import { formatScore } from "@/lib/formatScore";
import { DIMENSION_LABELS } from "@/lib/researchStateMachine";

export function CandidateComparison({ candidates }: { candidates: CandidateScore[] }) {
  const top = candidates.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl uppercase">
          {top.length} Candidates Remain
        </h2>
        <div className="h-[3px] w-16 bg-ink mt-2" />
      </div>

      {top.map((c, i) => (
        <div
          key={c.protocol}
          className={`border-brutal p-6 ${i === 0 ? "shadow-brutal bg-paper" : "bg-paper-muted opacity-90"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-ink/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-xl uppercase mt-1">{c.protocol}</h3>
            </div>
            <span className="font-mono text-4xl font-bold tabular-nums">{formatScore(c.composite)}</span>
          </div>

          <div className="mt-4 h-1 bg-ink/20">
            <div className="h-full bg-signal" style={{ width: `${c.composite}%` }} />
          </div>

          {i === 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
              {c.dimensions.slice(0, 6).map((d) => (
                <div key={d.key} className="flex justify-between">
                  <span className="text-ink/60">{DIMENSION_LABELS[d.key]}</span>
                  <span>{formatScore(d.score)}</span>
                </div>
              ))}
            </div>
          )}

          {c.gapSignal && i === 0 && (
            <p className="mt-4 text-sm text-warning border-t border-ink/20 pt-4">{c.gapSignal}</p>
          )}
        </div>
      ))}
    </div>
  );
}
