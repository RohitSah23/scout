"use client";

import { useState } from "react";
import type { ResearchSession, Source } from "@scout/schemas";
import { ReportHeader } from "./ReportHeader";
import { RecommendationBlock } from "./RecommendationBlock";
import { DecisionLogView } from "./DecisionLog";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { CandidateComparison } from "@/components/scoring/CandidateComparison";
import { CombinedSignalView } from "@/components/scoring/CombinedSignalView";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { SourceBadge } from "@/components/ui/Badge";

type Tab = "report" | "evidence" | "timeline";

const HIDDEN_SOURCE_TYPES = new Set(["paid"]);

export function ResearchReport({
  session,
  tab: initialTab = "report",
}: {
  session: ResearchSession;
  tab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [evidenceSource, setEvidenceSource] = useState<{ source: Source; index: number } | null>(null);

  const winner = session.scoreBreakdown?.candidates[0];
  const rec = session.recommendation;
  const evidenceSources = session.sources.filter((s) => !HIDDEN_SOURCE_TYPES.has(s.type));

  if (!rec || !winner) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "report", label: "Report" },
    { id: "evidence", label: "Evidence" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-2 border-b-2 border-ink overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-display text-xs uppercase tracking-widest shrink-0 ${
              tab === t.id ? "bg-ink text-paper" : "hover:bg-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "report" && (
        <div className="space-y-12">
          <ReportHeader
            title={session.chain ? `${session.chain} ${session.category ?? "Research"}` : "Research"}
            subtitle={session.request}
          />
          <RecommendationBlock
            recommendation={rec}
            confidence={session.confidence}
            sources={evidenceSources.map((s) => s.name)}
          />

          <div className="grid md:grid-cols-2 gap-8">
            <ScoreBreakdown candidate={winner} disclaimer={session.scoreBreakdown?.disclaimer} />
            <CombinedSignalView candidate={winner} />
          </div>

          <CandidateComparison candidates={session.scoreBreakdown?.candidates ?? []} />

          {rec.why && (
            <div>
              <h3 className="font-display text-sm uppercase tracking-widest mb-4">Why</h3>
              <ol className="space-y-4">
                {rec.why.map((w, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{w}</span>
                    {evidenceSources[i] && (
                      <SourceBadge name={evidenceSources[i].name} index={i + 1} />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {tab === "evidence" && (
        <div className="space-y-8">
          <p className="text-sm text-ink/70 max-w-2xl">
            Live data pulled during this research run — on-chain subgraph metrics and web keyword/SERP intelligence,
            shown as tables and charts rather than raw JSON.
          </p>
          {evidenceSources.map((s, i) => (
            <EvidencePanel key={s.id} source={s} index={i + 1} />
          ))}
        </div>
      )}

      {tab === "timeline" && (
        <DecisionLogView
          entries={session.decisionLog.filter(
            (e) =>
              !e.eventType?.startsWith("payment") &&
              !e.eventType?.startsWith("ens") &&
              e.eventType !== "uncertainty.detected" &&
              e.eventType !== "deep_analysis.received",
          )}
        />
      )}

      {evidenceSource && (
        <EvidenceDrawer
          source={evidenceSource.source}
          index={evidenceSource.index}
          open
          onClose={() => setEvidenceSource(null)}
        />
      )}
    </div>
  );
}
