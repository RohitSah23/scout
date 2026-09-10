"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { AgentStatus } from "@/components/shell/AgentStatus";
import { ResearchTimeline } from "@/components/research/ResearchTimeline";
import { CandidateFunnel } from "@/components/research/CandidateFunnel";
import { CandidateComparison } from "@/components/scoring/CandidateComparison";
import { ResearchReport } from "@/components/report/ResearchReport";
import { ErrorState } from "@/components/ui/ErrorState";
import { JudgeView } from "@/components/modes/JudgeView";
import { TechnicalView } from "@/components/modes/TechnicalView";
import { PaymentPanel } from "@/components/payment/PaymentPanel";
import { useResearchStream } from "@/lib/hooks/useResearchStream";

function ResearchDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [judgeMode, setJudgeMode] = useState(false);

  useEffect(() => {
    setJudgeMode(
      searchParams.get("judge") === "1" ||
        localStorage.getItem("scout_judge_mode") === "1",
    );
  }, [searchParams]);

  const { logs, session, paymentPending, loading, error, refreshSession } = useResearchStream(id);
  const lastLog = logs[logs.length - 1];
  const initialTab = (searchParams.get("tab") as "report" | "evidence" | "timeline") ?? "report";

  return (
    <ScoutShell session={session} lastLog={lastLog}>
      <div className="max-w-scout mx-auto px-4 md:px-8 py-8 md:py-12">
        {error && session?.status === "failed" && (
          <ErrorState message={error} onRetry={refreshSession} />
        )}

        {session?.status === "awaiting_payment" && paymentPending && (
          <PaymentPanel
            researchId={id}
            session={session}
            paymentPending={paymentPending}
            onComplete={refreshSession}
          />
        )}

        {session?.status === "completed" && session.recommendation ? (
          <ResearchReport session={session} tab={initialTab} />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ResearchTimeline entries={logs} loading={loading} />
              {session?.scoreBreakdown && session.status !== "completed" && (
                <CandidateComparison
                  candidates={session.scoreBreakdown.candidates}
                  rawCandidates={session.candidates}
                />
              )}
              <TechnicalView />
            </div>

            <div className="space-y-6">
              <div className="border-brutal p-6 sticky top-24">
                <AgentStatus session={session} lastLog={lastLog} />
              </div>
              <CandidateFunnel session={session} />
              {judgeMode && <JudgeView logs={logs} />}
            </div>
          </div>
        )}
      </div>
    </ScoutShell>
  );
}

export default function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense>
      <ResearchDetailContent id={id} />
    </Suspense>
  );
}
