"use client";

export interface BarDatum {
  label: string;
  value: number;
  secondary?: number;
}

export function MiniBarChart({
  data,
  primaryLabel = "Value",
  secondaryLabel,
  formatValue = (v) => v.toLocaleString(),
  height = 160,
}: {
  data: BarDatum[];
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (v: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-ink/50 font-mono">No chart data</p>;
  }

  const maxPrimary = Math.max(...data.map((d) => d.value), 1);
  const maxSecondary = secondaryLabel
    ? Math.max(...data.map((d) => d.secondary ?? 0), 1)
    : 1;
  const barWidth = Math.min(28, Math.floor(600 / data.length) - 4);
  const gap = 4;
  const chartWidth = data.length * (barWidth + gap);
  const chartHeight = height - 28;

  return (
    <div className="space-y-2">
      <div className="flex gap-4 font-mono text-xs text-ink/60 uppercase">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-ink" />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-signal" />
            {secondaryLabel}
          </span>
        )}
      </div>
      <div className="overflow-x-auto pb-2">
        <svg
          width={Math.max(chartWidth, 200)}
          height={height}
          role="img"
          aria-label={`Bar chart: ${primaryLabel}`}
          className="font-mono text-[10px]"
        >
          {data.map((d, i) => {
            const x = i * (barWidth + gap);
            const h1 = (d.value / maxPrimary) * chartHeight;
            const h2 = secondaryLabel ? ((d.secondary ?? 0) / maxSecondary) * chartHeight : 0;
            const groupWidth = secondaryLabel ? barWidth / 2 - 1 : barWidth;

            return (
              <g key={`${d.label}-${i}`}>
                <rect
                  x={x}
                  y={chartHeight - h1 + 4}
                  width={groupWidth}
                  height={Math.max(h1, 2)}
                  className="fill-ink"
                />
                {secondaryLabel && (
                  <rect
                    x={x + groupWidth + 2}
                    y={chartHeight - h2 + 4}
                    width={groupWidth}
                    height={Math.max(h2, 2)}
                    className="fill-signal"
                  />
                )}
                <text
                  x={x + barWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  className="fill-ink/60"
                >
                  {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                </text>
                <title>
                  {d.label}: {formatValue(d.value)}
                  {secondaryLabel && d.secondary != null ? ` · ${secondaryLabel}: ${formatValue(d.secondary)}` : ""}
                </title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
