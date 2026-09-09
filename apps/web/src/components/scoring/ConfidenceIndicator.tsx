"use client";

import { formatScore } from "@/lib/formatScore";

export function ConfidenceIndicator({
  before,
  after,
  label = "CONFIDENCE",
}: {
  before?: number;
  after?: number;
  label?: string;
}) {
  if (before === undefined && after === undefined) return null;

  return (
    <div className="flex gap-8 font-mono">
      {before !== undefined && (
        <div>
          <p className="text-xs uppercase text-ink/50">Before</p>
          <p className="text-3xl font-bold tabular-nums">{formatScore(before)}%</p>
          <p className="text-xs uppercase mt-1 text-warning">Uncertain</p>
        </div>
      )}
      {after !== undefined && (
        <div>
          <p className="text-xs uppercase text-ink/50">After</p>
          <p className="text-3xl font-bold tabular-nums text-success">{formatScore(after)}%</p>
          <p className="text-xs uppercase mt-1 text-success">Decision</p>
        </div>
      )}
      {!before && !after && (
        <div>
          <p className="text-3xl font-bold tabular-nums">{label}</p>
        </div>
      )}
    </div>
  );
}
