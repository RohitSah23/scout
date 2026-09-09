export function formatUsd(value: number | string | undefined | null): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPct(value: number | undefined | null, signed = true): string {
  if (value == null || Number.isNaN(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatTimestamp(ts: string | number | undefined): string {
  if (ts == null) return "—";
  const n = typeof ts === "string" ? parseInt(ts, 10) : ts;
  if (Number.isNaN(n)) return String(ts);
  const d = n < 1e12 ? new Date(n * 1000) : new Date(n);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function protocolFromSourceId(id: string): string {
  const parts = id.split("-");
  if (parts.length < 3) return id;
  const chain = parts[parts.length - 1];
  const protocol = parts.slice(1, -1).join(" ");
  return `${protocol} (${chain})`;
}

export function pctChange(recent: number, prior: number): number | null {
  if (prior <= 0 || recent <= 0) return null;
  return Math.round(((recent - prior) / prior) * 1000) / 10;
}
