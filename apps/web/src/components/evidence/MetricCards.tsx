"use client";

export function MetricCards({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string; tone?: "default" | "positive" | "negative" }>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="border border-ink/20 bg-paper-muted/40 p-3">
          <p className="font-display text-[10px] uppercase tracking-widest text-ink/50">{item.label}</p>
          <p
            className={`mt-1 font-mono text-lg font-bold tabular-nums ${
              item.tone === "positive"
                ? "text-success"
                : item.tone === "negative"
                  ? "text-error"
                  : ""
            }`}
          >
            {item.value}
          </p>
          {item.hint && <p className="mt-0.5 text-[10px] text-ink/50">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
