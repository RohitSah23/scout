import type { CandidateScore, Recommendation } from "@scout/schemas";
import { ToolBadge } from "@/components/ui/Badge";
import { candidateDisplaySubtitle, candidateDisplayTitle } from "@/lib/candidateSummary";
import { formatScore } from "@/lib/formatScore";

export function RecommendationBlock({
  recommendation,
  winner,
  confidence,
  sources,
}: {
  recommendation: Recommendation;
  winner?: CandidateScore;
  confidence?: number;
  sources?: string[];
}) {
  const title = winner ? candidateDisplayTitle(winner) : recommendation.winner;
  const subtitle = winner ? candidateDisplaySubtitle(winner) : null;

  return (
    <div className="border-brutal bg-paper-dark text-paper p-8 md:p-12 space-y-8">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-paper/60">Top Lending Asset</p>
        <h2 className="font-display text-4xl md:text-6xl uppercase mt-2 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="font-display text-lg md:text-xl uppercase tracking-wide text-paper/60 mt-2">
            {subtitle}
          </p>
        )}
        <p className="font-mono text-5xl md:text-7xl font-bold mt-4 tabular-nums">
          {formatScore(recommendation.score)}
          <span className="text-2xl text-paper/40">/100</span>
        </p>
      </div>

      <p className="font-display text-xl md:text-2xl uppercase leading-snug max-w-2xl">
        {recommendation.action}
      </p>

      {confidence !== undefined && (
        <div className="flex flex-wrap gap-8 font-mono text-sm border-t border-paper/20 pt-6">
          <div>
            <p className="text-paper/50 uppercase text-xs">{formatScore(confidence)}%</p>
            <p>Confidence</p>
          </div>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-paper/60 mb-3">Supported By</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(sources)].map((s) => (
              <ToolBadge key={s} tool={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
