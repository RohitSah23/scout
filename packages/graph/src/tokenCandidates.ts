import type { Candidate, GraphQueryKind, MessariDeployment, OnchainMetrics } from "@scout/schemas";
import { isMainstreamToken } from "./mainstreamTokens.js";
import type { TrendingReserve } from "./trending.js";

function pct1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pctChange(recent: number, prior: number): number {
  if (prior <= 0) return recent > 0 ? 100 : 0;
  return pct1(((recent - prior) / prior) * 100);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface MessariMarket {
  id?: string;
  name?: string;
  totalValueLockedUSD?: string;
  totalDepositBalanceUSD?: string;
  totalBorrowBalanceUSD?: string;
  inputToken?: { symbol?: string; decimals?: number };
}

interface MessariMarketSnapshot {
  timestamp?: string;
  totalValueLockedUSD?: string;
  dailyDepositUSD?: string;
  dailyBorrowUSD?: string;
  market?: { id?: string };
}

function metricsFromMessariMarket(
  market: MessariMarket,
  snapshots: MessariMarketSnapshot[],
): OnchainMetrics {
  const sorted = [...snapshots].sort(
    (a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0),
  );

  const recentTvl = parseFloat(
    market.totalValueLockedUSD ?? sorted[0]?.totalValueLockedUSD ?? "0",
  );
  const priorTvl = parseFloat(
    sorted[sorted.length - 1]?.totalValueLockedUSD ?? market.totalValueLockedUSD ?? "0",
  );
  const tvlChange = pctChange(recentTvl, priorTvl);

  const recentWindow = sorted.slice(0, 7);
  const priorWindow = sorted.slice(-7);
  const dailyVolume = (s: MessariMarketSnapshot) =>
    parseFloat(s.dailyDepositUSD ?? "0") + parseFloat(s.dailyBorrowUSD ?? "0");
  const recentVol = avg(recentWindow.map(dailyVolume));
  const priorVol = avg(priorWindow.map(dailyVolume));
  const volumeChange = pctChange(recentVol, priorVol);

  return {
    tvlChangePct: tvlChange,
    volumeChangePct: volumeChange,
    txChangePct: pct1(volumeChange * 0.5),
    activeAddressesChangePct: volumeChange,
    newUsersChangePct: pct1(volumeChange * 0.85),
    priorPeriodGrowthPct: tvlChange,
  };
}

export function extractMessariTokenCandidates(
  dep: MessariDeployment,
  payload: Record<string, unknown> | undefined,
): Candidate[] {
  const markets = (payload?.markets ?? []) as MessariMarket[];
  const snapshots = (payload?.marketSnapshots ?? []) as MessariMarketSnapshot[];

  if (markets.length === 0) return [];

  const snapshotsByMarket = new Map<string, MessariMarketSnapshot[]>();
  for (const snapshot of snapshots) {
    const marketId = snapshot.market?.id;
    if (!marketId) continue;
    const list = snapshotsByMarket.get(marketId) ?? [];
    list.push(snapshot);
    snapshotsByMarket.set(marketId, list);
  }

  const depSlug = slugify(dep.messariSlug ?? dep.protocol);

  const altMarkets = markets.filter((market) => {
    const symbol = market.inputToken?.symbol ?? market.name ?? "";
    return symbol && !isMainstreamToken(symbol);
  });

  return altMarkets.slice(0, 5).map((market) => {
    const symbol = market.inputToken?.symbol ?? market.name ?? "UNKNOWN";
    const marketSnaps = market.id ? snapshotsByMarket.get(market.id) ?? [] : [];
    const tvlUsd = parseFloat(market.totalValueLockedUSD ?? "0");
    const depositUsd = parseFloat(market.totalDepositBalanceUSD ?? "0");
    const borrowUsd = parseFloat(market.totalBorrowBalanceUSD ?? "0");
    const activityUsd = depositUsd + borrowUsd;

    return {
      id: `token-${slugify(symbol)}-${depSlug}-${dep.chain}`,
      assetSymbol: symbol,
      sourceProtocol: dep.protocol,
      protocol: `${symbol} · ${dep.protocol}`,
      chain: dep.chain,
      marketId: market.id,
      windowLabel: "7d",
      tokenMetrics: {
        tvlUsd,
        grossFlowUsd: activityUsd > 0 ? activityUsd : tvlUsd,
        txCount: marketSnaps.length,
      },
      onchainMetrics: metricsFromMessariMarket(market, marketSnaps),
      provenance: {
        subgraphId: dep.subgraphId,
        deploymentId: dep.deploymentId,
        schemaVersion: dep.schemaVersion,
        methodologyVersion: dep.methodologyVersion ?? dep.schemaVersion,
      },
    };
  });
}

export function extractAaveTrendingTokenCandidates(
  dep: MessariDeployment,
  trending: TrendingReserve[],
): Candidate[] {
  const depSlug = slugify(dep.messariSlug ?? dep.protocol);

  const altTrending = trending.filter((row) => !isMainstreamToken(row.symbol));

  return altTrending.slice(0, 5).map((row) => {
    const netPct =
      row.grossFlowUsd > 0 ? pct1((row.netInflowUsd / row.grossFlowUsd) * 100) : 0;
    const liqPct =
      row.grossFlowUsd > 0 ? pct1((row.liquidationUsd / row.grossFlowUsd) * 100) : 0;

    return {
      id: `token-${slugify(row.symbol)}-${depSlug}-${dep.chain}`,
      assetSymbol: row.symbol,
      sourceProtocol: dep.protocol,
      protocol: `${row.symbol} · ${dep.protocol}`,
      chain: dep.chain,
      windowLabel: "1h",
      tokenMetrics: {
        trendingScore: row.trendingScore,
        grossFlowUsd: row.grossFlowUsd,
        netInflowUsd: row.netInflowUsd,
        txCount: row.txCount,
        tvlUsd: row.grossFlowUsd,
      },
      onchainMetrics: {
        tvlChangePct: netPct,
        volumeChangePct: row.trendingScore > 0 ? pct1(Math.min(100, row.trendingScore / 10000)) : 0,
        txChangePct: liqPct,
        activeAddressesChangePct: pct1(row.txCount),
        newUsersChangePct: pct1(row.txCount * 0.5),
        priorPeriodGrowthPct: netPct,
      },
      provenance: {
        subgraphId: dep.subgraphId,
        deploymentId: dep.deploymentId,
        schemaVersion: dep.schemaVersion,
        methodologyVersion: dep.methodologyVersion ?? dep.schemaVersion,
      },
    };
  });
}

export function extractTokenCandidates(
  dep: MessariDeployment,
  kind: GraphQueryKind,
  payload: Record<string, unknown> | undefined,
  trendingReserves?: TrendingReserve[],
): Candidate[] {
  if (kind === "aave-v3-trending") {
    const reserves = trendingReserves ?? (payload?.trendingReserves as TrendingReserve[] | undefined);
    if (!reserves?.length) return [];
    return extractAaveTrendingTokenCandidates(dep, reserves);
  }
  if (kind === "messari") {
    return extractMessariTokenCandidates(dep, payload);
  }
  return [];
}
