"use client";

import type { Candidate, CandidateScore } from "@scout/schemas";
import { formatScore } from "@/lib/formatScore";
import {
  candidateDisplaySubtitle,
  candidateDisplayTitle,
  candidateInsight,
  matchRawCandidate,
  momentumLabel,
  scoreBandLabel,
} from "@/lib/candidateSummary";
import { DIMENSION_LABELS } from "@/lib/researchStateMachine";

export function CandidateScoreCard({
  candidate,
  rank,
  rawCandidates,
  highlighted = false,
}: {
  candidate: CandidateScore;
  rank: number;
  rawCandidates?: Candidate[];
  highlighted?: boolean;
}) {
  const raw = matchRawCandidate(candidate, rawCandidates);
  const insight = candidateInsight(candidate, raw);
  const momentum = momentumLabel(candidate.momentum);
  const band = scoreBandLabel(candidate);

  return (
    <article
      className={`border-brutal overflow-hidden ${
        highlighted ? "shadow-brutal bg-paper ring-2 ring-signal/30" : "bg-paper-muted/40"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/15 px-5 py-4 bg-paper">
        <div className="flex items-start gap-4 min-w-0">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center font-mono text-sm font-bold ${
              highlighted ? "bg-signal text-paper" : "bg-ink text-paper"
            }`}
          >
            {String(rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg md:text-xl uppercase truncate">
              {candidateDisplayTitle(candidate)}
            </h3>
            <p className="font-mono text-xs text-ink/50 uppercase mt-0.5">
              {candidateDisplaySubtitle(candidate)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {momentum && (
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-ink/20 bg-paper">
                  {momentum}
                </span>
              )}
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-ink/20 bg-paper">
                Risk {formatScore(candidate.riskScore)}
              </span>
              {band && (
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-ink/20 bg-paper">
                  Band {band}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-3xl md:text-4xl font-bold tabular-nums leading-none">
            {formatScore(candidate.composite)}
          </p>
          <p className="font-mono text-[10px] uppercase text-ink/50 mt-1">Opportunity</p>
        </div>
      </header>

      <div className="px-5 py-3 bg-paper-dark text-paper border-b border-ink/15">
        <p className="font-mono text-xs md:text-sm leading-relaxed">
          <span className="text-paper/50 uppercase tracking-widest text-[10px] block mb-1">
            Signal
          </span>
          {insight}
        </p>
      </div>

      <div className="p-5 space-y-4">
        <p className="font-display text-[10px] uppercase tracking-widest text-ink/50">
          Score breakdown
        </p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          {candidate.dimensions.map((d) => (
            <div key={d.key} className="space-y-1.5">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-ink/80 leading-tight">
                  {DIMENSION_LABELS[d.key] ?? d.key}
                </span>
                <span className="font-mono tabular-nums font-bold shrink-0">
                  {formatScore(d.score)}
                </span>
              </div>
              <div className="h-2 bg-paper border border-ink/15">
                <div
                  className={`h-full transition-all ${highlighted && d.score >= 70 ? "bg-signal" : "bg-ink"}`}
                  style={{ width: `${Math.min(d.score, 100)}%` }}
                />
              </div>
              {d.rationale && (
                <p className="text-[10px] text-ink/45 leading-snug line-clamp-2">{d.rationale}</p>
              )}
            </div>
          ))}
        </div>

        {candidate.flags && candidate.flags.length > 0 && (
          <div className="pt-3 border-t border-ink/10 flex flex-wrap gap-2">
            {candidate.flags.map((flag) => (
              <span
                key={flag}
                className="font-mono text-[10px] uppercase px-2 py-0.5 border border-warning/40 text-warning bg-warning/5"
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
