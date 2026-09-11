import type { Source } from "@scout/schemas";
import { formatTimestamp, pctChange, protocolFromSourceId } from "./format";

export type GraphEvidenceKind =
  | "compound-v3"
  | "aave-v3"
  | "aave-v3-trending"
  | "messari"
  | "unknown";

export interface TimeSeriesPoint {
  label: string;
  timestamp: number;
  primary: number;
  secondary?: number;
  primaryLabel: string;
  secondaryLabel?: string;
}

export interface ReserveRow {
  symbol: string;
  liquidity: number;
  changePct: number | null;
  trendingScore?: number;
  txCount?: number;
}

export interface ParsedGraphEvidence {
  kind: GraphEvidenceKind;
  protocol: string;
  live: boolean;
  series: TimeSeriesPoint[];
  reserves?: ReserveRow[];
  summary: {
    primaryLabel: string;
    primaryValue: string;
    secondaryLabel?: string;
    secondaryValue?: string;
    changePct: number | null;
    dataPoints: number;
  };
}

function innerData(source: Source): Record<string, unknown> | undefined {
  const root = source.data as { data?: Record<string, unknown> } | undefined;
  return root?.data;
}

function detectKind(payload: Record<string, unknown> | undefined): GraphEvidenceKind {
  if (!payload) return "unknown";
  if (Array.isArray(payload.trendingReserves)) return "aave-v3-trending";
  if (Array.isArray(payload.dailyProtocolAccountings)) return "compound-v3";
  if (Array.isArray(payload.reserves)) return "aave-v3";
  if (Array.isArray(payload.marketDailySnapshots)) return "messari";
  return "unknown";
}

export function parseGraphEvidence(source: Source): ParsedGraphEvidence | null {
  const payload = innerData(source);
  const kind = detectKind(payload);
  const protocol = protocolFromSourceId(source.id);
  const live = Boolean((source.data as { live?: boolean })?.live);

  if (kind === "compound-v3") {
    const days = (payload?.dailyProtocolAccountings ?? []) as Array<{
      timestamp: string;
      accounting?: { totalSupplyUsd?: string; totalBorrowUsd?: string };
    }>;

    const sorted = [...days].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    const series: TimeSeriesPoint[] = sorted
      .slice()
      .reverse()
      .map((d) => ({
        label: formatTimestamp(d.timestamp),
        timestamp: Number(d.timestamp),
        primary: parseFloat(d.accounting?.totalSupplyUsd ?? "0"),
        secondary: parseFloat(d.accounting?.totalBorrowUsd ?? "0"),
        primaryLabel: "Supply",
        secondaryLabel: "Borrow",
      }));

    const recentSupply = parseFloat(sorted[0]?.accounting?.totalSupplyUsd ?? "0");
    const priorSupply = parseFloat(sorted[sorted.length - 1]?.accounting?.totalSupplyUsd ?? "0");
    const recentBorrow = parseFloat(sorted[0]?.accounting?.totalBorrowUsd ?? "0");

    return {
      kind,
      protocol,
      live,
      series,
      summary: {
        primaryLabel: "Total supply",
        primaryValue: recentSupply.toFixed(0),
        secondaryLabel: "Total borrow",
        secondaryValue: recentBorrow.toFixed(0),
        changePct: pctChange(recentSupply, priorSupply),
        dataPoints: sorted.length,
      },
    };
  }

  if (kind === "aave-v3-trending") {
    const trending = (payload?.trendingReserves ?? []) as Array<{
      symbol?: string;
      trendingScore?: number;
      grossFlowUsd?: number;
      netInflowUsd?: number;
      txCount?: number;
    }>;

    const rows: ReserveRow[] = trending
      .map((row) => ({
        symbol: row.symbol ?? "—",
        liquidity: row.grossFlowUsd ?? 0,
        changePct: pctChange(row.netInflowUsd ?? 0, row.grossFlowUsd ?? 0),
        trendingScore: row.trendingScore ?? 0,
        txCount: row.txCount ?? 0,
      }))
      .slice(0, 10);

    const topScore = rows[0]?.trendingScore ?? 0;
    const totalFlow = rows.reduce((sum, row) => sum + row.liquidity, 0);

    const series: TimeSeriesPoint[] = rows.slice(0, 6).map((row) => ({
      label: row.symbol,
      timestamp: 0,
      primary: row.trendingScore ?? 0,
      primaryLabel: "Trending score",
    }));

    return {
      kind,
      protocol,
      live,
      series,
      reserves: rows,
      summary: {
        primaryLabel: "Top trending score (1h)",
        primaryValue: topScore.toFixed(0),
        secondaryLabel: "Top asset",
        secondaryValue: rows[0]?.symbol ?? "—",
        changePct: topScore > 0 ? pctChange(topScore, totalFlow / Math.max(rows.length, 1)) : null,
        dataPoints: rows.length,
      },
    };
  }

  if (kind === "aave-v3") {
    const reserves = (payload?.reserves ?? []) as Array<{
      symbol?: string;
      totalLiquidity?: string;
      paramsHistory?: Array<{ totalLiquidity?: string }>;
    }>;

    const rows: ReserveRow[] = reserves
      .map((r) => {
        const liquidity = parseFloat(r.totalLiquidity ?? "0");
        const history = r.paramsHistory ?? [];
        const oldest = parseFloat(history[history.length - 1]?.totalLiquidity ?? r.totalLiquidity ?? "0");
        return {
          symbol: r.symbol ?? "—",
          liquidity,
          changePct: pctChange(liquidity, oldest),
        };
      })
      .sort((a, b) => b.liquidity - a.liquidity)
      .slice(0, 10);

    const totalLiquidity = rows.reduce((s, r) => s + r.liquidity, 0);
    const priorTotal = reserves.reduce((s, r) => {
      const history = r.paramsHistory ?? [];
      const oldest = parseFloat(history[history.length - 1]?.totalLiquidity ?? r.totalLiquidity ?? "0");
      return s + oldest;
    }, 0);

    const series: TimeSeriesPoint[] = rows.slice(0, 6).map((r) => ({
      label: r.symbol,
      timestamp: 0,
      primary: r.liquidity,
      primaryLabel: "Liquidity",
    }));

    return {
      kind,
      protocol,
      live,
      series,
      reserves: rows,
      summary: {
        primaryLabel: "Aggregate liquidity",
        primaryValue: totalLiquidity.toFixed(0),
        changePct: pctChange(totalLiquidity, priorTotal),
        dataPoints: reserves.length,
      },
    };
  }

  if (kind === "messari") {
    const snapshots = (payload?.marketDailySnapshots ?? []) as Array<{
      timestamp?: string;
      totalValueLockedUSD?: string;
      dailyActiveUsers?: number;
      dailyDepositVolumeUSD?: string;
      dailyBorrowVolumeUSD?: string;
    }>;

    const sorted = [...snapshots].sort((a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0));
    const series: TimeSeriesPoint[] = sorted
      .slice()
      .reverse()
      .map((s) => ({
        label: formatTimestamp(s.timestamp),
        timestamp: Number(s.timestamp ?? 0),
        primary: parseFloat(s.totalValueLockedUSD ?? "0"),
        secondary: s.dailyActiveUsers ?? 0,
        primaryLabel: "TVL",
        secondaryLabel: "DAU",
      }));

    const recentTvl = parseFloat(sorted[0]?.totalValueLockedUSD ?? "0");
    const priorTvl = parseFloat(sorted[sorted.length - 1]?.totalValueLockedUSD ?? "0");
    const recentDau = sorted[0]?.dailyActiveUsers ?? 0;

    return {
      kind,
      protocol,
      live,
      series,
      summary: {
        primaryLabel: "TVL",
        primaryValue: recentTvl.toFixed(0),
        secondaryLabel: "Daily active users",
        secondaryValue: String(recentDau),
        changePct: pctChange(recentTvl, priorTvl),
        dataPoints: sorted.length,
      },
    };
  }

  return null;
}
