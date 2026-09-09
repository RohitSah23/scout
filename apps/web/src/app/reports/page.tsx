"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { fetchReports, type ResearchListItem } from "@/lib/api";
import { formatScore } from "@/lib/formatScore";

export default function ReportsPage() {
  const [reports, setReports] = useState<ResearchListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports("completed")
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScoutShell>
      <div className="max-w-scout mx-auto px-4 md:px-8 py-12 md:py-16">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-8">Your Research</h1>

        {loading && (
          <p className="font-mono text-sm text-ink/50">Loading reports…</p>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState
            title="No Reports."
            description="Your completed research will appear here."
            actionLabel="Start Research →"
            onAction={() => { window.location.href = "/"; }}
          />
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {reports.map((r) => (
            <Link key={r.researchId} href={`/research/${r.researchId}?tab=report`}>
              <Card shadow className="h-full hover:shadow-brutal-hover transition-all hover:-translate-y-0.5">
                <p className="font-display text-xs uppercase tracking-widest text-ink/60">
                  {r.chain ?? "base"} · {r.category ?? "research"}
                </p>
                <p className="mt-2 text-sm line-clamp-2 text-ink/80">{r.request}</p>
                {r.winner && (
                  <p className="font-display text-xl uppercase mt-4">{r.winner}</p>
                )}
                <div className="mt-4 flex items-end justify-between">
                  {r.score !== undefined && (
                    <span className="font-mono text-3xl font-bold">{formatScore(r.score)}<span className="text-sm text-ink/40">/100</span></span>
                  )}
                  <div className="text-right font-mono text-xs text-ink/60">
                    {r.candidateCount} candidates
                    {r.confidence !== undefined && ` · ${formatScore(r.confidence)}%`}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </ScoutShell>
  );
}
