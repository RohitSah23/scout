"use client";

import { useState } from "react";
import type { PaymentPending, ResearchSession } from "@scout/schemas";
import { authorizePayment, denyPayment } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaymentTimeline } from "./PaymentTimeline";
import { UncertaintyPanel } from "./UncertaintyPanel";

export function PaymentPanel({
  researchId,
  session,
  paymentPending,
  onComplete,
}: {
  researchId: string;
  session: ResearchSession;
  paymentPending: PaymentPending;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"prompt" | "settled">("prompt");
  const [activeStep, setActiveStep] = useState(0);

  async function handleAuthorize() {
    setLoading(true);
    setActiveStep(2);
    try {
      setActiveStep(3);
      await authorizePayment(researchId);
      setPhase("settled");
      setActiveStep(5);
      onComplete();
    } catch {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      await denyPayment(researchId);
      onComplete();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-paper/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8 py-8">
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wide">
            Scout Needs More Evidence
          </h1>
        </div>

        {phase === "prompt" ? (
          <>
            <UncertaintyPanel session={session} paymentPending={paymentPending} />

            <Card shadow>
              <p className="font-display text-xs uppercase tracking-widest text-signal">Paid Research</p>
              <h2 className="font-display text-xl uppercase mt-2">{paymentPending.serviceName}</h2>
              <p className="font-mono text-3xl mt-4">${paymentPending.amount.toFixed(2)} USDC</p>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="font-display text-xs uppercase text-ink/50">Why?</p>
                  <p className="mt-1">{paymentPending.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div>
                    <p className="text-ink/50 text-xs uppercase">Budget before</p>
                    <p>${paymentPending.budgetBefore.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-ink/50 text-xs uppercase">After purchase</p>
                    <p>${paymentPending.budgetAfter.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-ink/50 text-xs uppercase">Expected impact</p>
                  <p className="text-success font-display">HIGH</p>
                </div>
              </div>
            </Card>

            <PaymentTimeline activeStep={activeStep} />

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="danger"
                loading={loading}
                onClick={handleAuthorize}
                className="flex-1"
              >
                Authorize ${paymentPending.amount.toFixed(2)}
              </Button>
              <Button variant="secondary" disabled={loading} onClick={handleSkip} className="flex-1">
                Skip
              </Button>
            </div>
          </>
        ) : (
          <Card shadow className="text-center space-y-4">
            <p className="font-display text-2xl uppercase text-success">Payment Settled</p>
            <p className="font-mono text-xl">${paymentPending.amount.toFixed(2)} USDC</p>
            <p className="font-mono text-sm">x402 ✓</p>
            <PaymentTimeline activeStep={5} />
          </Card>
        )}
      </div>
    </div>
  );
}
