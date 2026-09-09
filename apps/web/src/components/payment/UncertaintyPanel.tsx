"use client";

import type { PaymentPending, ResearchSession } from "@scout/schemas";
import { Card } from "@/components/ui/Card";
import { formatScore } from "@/lib/formatScore";

export function UncertaintyPanel({
  session,
  paymentPending,
}: {
  session: ResearchSession;
  paymentPending: PaymentPending;
}) {
  const top2 = session.scoreBreakdown?.candidates.slice(0, 2) ?? [];
  const [a, b] = paymentPending.targetProtocols;

  return (
    <Card shadow className="border-warning">
      <h2 className="font-display text-xl uppercase text-warning">Scout Is Not Convinced</h2>
      <p className="mt-4 text-ink/80">
        {a && b
          ? `${a} and ${b} are too close to separate confidently.`
          : top2.length >= 2
            ? `${top2[0].protocol} and ${top2[1].protocol} are too close to separate confidently.`
            : "Top candidates remain too close."}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm">
        <div>
          <p className="text-ink/50 uppercase text-xs">Current confidence</p>
          <p className="text-2xl">{formatScore(paymentPending.confidence)}%</p>
        </div>
        <div>
          <p className="text-ink/50 uppercase text-xs">Gap</p>
          <p>{top2.length >= 2 ? formatScore(top2[0].composite - top2[1].composite) : "—"} pts</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink/70">
        One additional dataset could materially change the decision.
      </p>
    </Card>
  );
}
