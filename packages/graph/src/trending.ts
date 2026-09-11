import { isMainstreamToken } from "./mainstreamTokens.js";

export interface TrendingReserve {
  symbol: string;
  supplyUsd: number;
  withdrawUsd: number;
  borrowUsd: number;
  repayUsd: number;
  liquidationUsd: number;
  netInflowUsd: number;
  grossFlowUsd: number;
  txCount: number;
  trendingScore: number;
}

interface ReserveRef {
  symbol?: string;
  decimals?: number;
}

interface AmountEvent {
  amount?: string;
  assetPriceUSD?: string;
  reserve?: ReserveRef;
}

interface LiquidationEvent {
  collateralAmount?: string;
  principalAmount?: string;
  collateralAssetPriceUSD?: string;
  borrowAssetPriceUSD?: string;
  collateralReserve?: ReserveRef;
  principalReserve?: ReserveRef;
}

type SymbolStats = {
  supplyUsd: number;
  withdrawUsd: number;
  borrowUsd: number;
  repayUsd: number;
  liquidationUsd: number;
  txCount: number;
};

const MIN_TX_COUNT = 3;
const MIN_GROSS_FLOW_USD = 10_000;
const TOP_N = 5;

export function oneHourAgoUnix(): number {
  return Math.floor(Date.now() / 1000) - 3600;
}

function amountToUsd(
  amount: string | undefined,
  decimals: number | undefined,
  priceUsd: string | undefined,
): number {
  const raw = parseFloat(amount ?? "0");
  const dec = decimals ?? 18;
  const price = parseFloat(priceUsd ?? "0");
  if (raw <= 0 || price <= 0) return 0;
  return (raw / 10 ** dec) * price;
}

function getStats(map: Map<string, SymbolStats>, symbol: string): SymbolStats {
  let stats = map.get(symbol);
  if (!stats) {
    stats = {
      supplyUsd: 0,
      withdrawUsd: 0,
      borrowUsd: 0,
      repayUsd: 0,
      liquidationUsd: 0,
      txCount: 0,
    };
    map.set(symbol, stats);
  }
  return stats;
}

function addEvent(
  map: Map<string, SymbolStats>,
  symbol: string | undefined,
  usd: number,
  field: keyof Omit<SymbolStats, "txCount">,
): void {
  if (!symbol || usd <= 0) return;
  const stats = getStats(map, symbol);
  stats[field] += usd;
  stats.txCount += 1;
}

export function aggregateHourlyTrending(
  payload: Record<string, unknown> | undefined,
): TrendingReserve[] {
  const stats = new Map<string, SymbolStats>();

  for (const event of (payload?.supplies ?? []) as AmountEvent[]) {
    addEvent(
      stats,
      event.reserve?.symbol,
      amountToUsd(event.amount, event.reserve?.decimals, event.assetPriceUSD),
      "supplyUsd",
    );
  }
  for (const event of (payload?.borrows ?? []) as AmountEvent[]) {
    addEvent(
      stats,
      event.reserve?.symbol,
      amountToUsd(event.amount, event.reserve?.decimals, event.assetPriceUSD),
      "borrowUsd",
    );
  }
  for (const event of (payload?.repays ?? []) as AmountEvent[]) {
    addEvent(
      stats,
      event.reserve?.symbol,
      amountToUsd(event.amount, event.reserve?.decimals, event.assetPriceUSD),
      "repayUsd",
    );
  }
  for (const event of (payload?.redeemUnderlyings ?? []) as AmountEvent[]) {
    addEvent(
      stats,
      event.reserve?.symbol,
      amountToUsd(event.amount, event.reserve?.decimals, event.assetPriceUSD),
      "withdrawUsd",
    );
  }
  for (const event of (payload?.liquidationCalls ?? []) as LiquidationEvent[]) {
    const collateralUsd = amountToUsd(
      event.collateralAmount,
      event.collateralReserve?.decimals ?? 18,
      event.collateralAssetPriceUSD,
    );
    const principalUsd = amountToUsd(
      event.principalAmount,
      event.principalReserve?.decimals ?? 18,
      event.borrowAssetPriceUSD,
    );
    if (collateralUsd > 0) {
      addEvent(stats, event.collateralReserve?.symbol, collateralUsd, "liquidationUsd");
    }
    if (principalUsd > 0) {
      addEvent(stats, event.principalReserve?.symbol, principalUsd, "liquidationUsd");
    }
  }

  const results: TrendingReserve[] = [];
  for (const [symbol, s] of stats) {
    const netInflowUsd = s.supplyUsd - s.withdrawUsd;
    const grossFlowUsd =
      s.supplyUsd + s.withdrawUsd + s.borrowUsd + s.repayUsd + s.liquidationUsd;
    const trendingScore = netInflowUsd + 0.5 * s.borrowUsd + 2.0 * s.liquidationUsd;

    if (s.txCount < MIN_TX_COUNT || grossFlowUsd < MIN_GROSS_FLOW_USD) continue;

    results.push({
      symbol,
      supplyUsd: s.supplyUsd,
      withdrawUsd: s.withdrawUsd,
      borrowUsd: s.borrowUsd,
      repayUsd: s.repayUsd,
      liquidationUsd: s.liquidationUsd,
      netInflowUsd,
      grossFlowUsd,
      txCount: s.txCount,
      trendingScore,
    });
  }

  return results
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .filter((row) => !isMainstreamToken(row.symbol))
    .slice(0, TOP_N);
}
