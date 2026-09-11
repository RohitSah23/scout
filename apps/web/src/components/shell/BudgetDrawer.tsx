"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { ResearchSession } from "@scout/schemas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function BudgetDrawer({
  open,
  onClose,
  session,
  defaultBudget = 0.5,
}: {
  open: boolean;
  onClose: () => void;
  session: ResearchSession | null;
  defaultBudget?: number;
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const budget = session?.budget;
  const remaining = budget?.remaining ?? defaultBudget;
  const initial = budget?.initial ?? defaultBudget;
  const spent = budget?.spent ?? 0;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 z-40" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-md bg-paper border-l-[3px] border-ink z-50 overflow-y-auto p-8 space-y-8"
        role="dialog"
        aria-label="Scout treasury"
      >
        <div className="flex justify-between items-start">
          <h2 className="font-display text-xl uppercase">Scout Treasury</h2>
          <button type="button" onClick={onClose} className="font-mono text-sm hover:text-signal">✕</button>
        </div>

        <Card shadow>
          <p className="font-display text-xs uppercase tracking-widest text-ink/60">Remaining</p>
          <p className="font-mono text-4xl mt-2">${remaining.toFixed(2)}</p>
          <p className="font-mono text-sm text-ink/60 mt-1">USDC</p>
        </Card>

        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between border-b border-ink/20 pb-2">
            <span>Initial</span>
            <span>${initial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-ink/20 pb-2">
            <span>Used</span>
            <span>${spent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Max / request</span>
            <span>${(budget?.perRequestCap ?? 0.1).toFixed(2)}</span>
          </div>
        </div>

        <div>
          <p className="font-display text-xs uppercase tracking-widest mb-3">Spending Policy</p>
          <div className="flex flex-wrap gap-2">
            {["USDC only", "Per-tx $0.10", "Allowlist enforced", "Arbitrary transfers blocked"].map((chip) => (
              <Badge key={chip}>{chip}</Badge>
            ))}
          </div>
        </div>

        {hasPrivy && (
          <div>
            {!authenticated ? (
              <button
                type="button"
                onClick={login}
                disabled={!ready}
                className="w-full border-brutal py-2 font-display text-sm uppercase"
              >
                Login with Privy
              </button>
            ) : (
              <p className="font-mono text-xs text-ink/60">
                Connected: {user?.email?.address ?? user?.wallet?.address ?? "user"}
              </p>
            )}
          </div>
        )}

        {session && spent > 0 && (
          <div>
            <p className="font-display text-xs uppercase tracking-widest mb-3">Transactions</p>
            <div className="space-y-2 font-mono text-xs">
              {session.sources
                .filter((s) => s.cost > 0)
                .map((s) => (
                  <div key={s.id} className="border-b border-ink/10 pb-2">
                    <div className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="text-signal">− ${s.cost.toFixed(2)}</span>
                    </div>
                    {s.txRef && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${s.txRef}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-signal underline"
                      >
                        Transaction ↗
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
