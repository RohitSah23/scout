"use client";

const STEPS = ["REQUEST", "402", "PAYMENT", "SETTLED", "DATA", "RESUMED"];

export function PaymentTimeline({ activeStep = 0 }: { activeStep?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-xs overflow-x-auto py-4">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2 py-1 border ${
              i <= activeStep ? "border-signal bg-signal text-paper" : "border-ink/30 text-ink/40"
            }`}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && <span className="text-ink/30">↓</span>}
        </div>
      ))}
    </div>
  );
}
