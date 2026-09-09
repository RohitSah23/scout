"use client";

export function BudgetMeter({
  initial,
  remaining,
  perRequestCap = 0.1,
  autoPay = true,
}: {
  initial: number;
  remaining?: number;
  perRequestCap?: number;
  autoPay?: boolean;
}) {
  const rem = remaining ?? initial;
  return (
    <div className="border-brutal p-6 space-y-4 bg-paper-muted">
      <p className="font-display text-xs uppercase tracking-widest">Scout Budget</p>
      <p className="font-mono text-4xl">${initial.toFixed(2)} <span className="text-lg">USDC</span></p>
      <div className="grid grid-cols-2 gap-4 font-mono text-sm">
        <div>
          <p className="text-ink/50 uppercase text-xs">Max / request</p>
          <p>${perRequestCap.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-ink/50 uppercase text-xs">Auto-pay</p>
          <p className="text-success">{autoPay ? "ENABLED" : "DISABLED"}</p>
        </div>
        {remaining !== undefined && (
          <div className="col-span-2">
            <p className="text-ink/50 uppercase text-xs">Remaining</p>
            <p>${rem.toFixed(2)} USDC</p>
          </div>
        )}
      </div>
    </div>
  );
}
