import type { DecisionLogEntry } from "@scout/schemas";

export function DecisionLogView({ entries }: { entries: DecisionLogEntry[] }) {
  const time = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm uppercase tracking-widest">Decision Log</h2>
      <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto border-brutal p-4 bg-paper-muted">
        {entries.map((e, i) => (
          <div
            key={`${e.timestamp}-${i}`}
            className={
              e.level === "payment"
                ? "text-signal"
                : e.level === "success"
                  ? "text-success"
                  : e.level === "warn"
                    ? "text-warning"
                    : "text-ink/70"
            }
          >
            <span className="text-ink/40">{time(e.timestamp)}</span> {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
