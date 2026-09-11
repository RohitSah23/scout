import type { GraphQueryKind } from "@scout/schemas";

/**
 * Messari Lending/CDP composable query — same GraphQL executed against every
 * Messari-standard deployment in the registry (1 query × N protocols).
 */
export const MESSARI_LENDING_STANDARD = "messari-lending-cdp";

export const LENDING_QUERY_TEMPLATE = `
query LendingProtocolMetrics($first: Int!) {
  protocols(first: $first) {
    id
    name
    slug
    schemaVersion
    methodologyVersion
    totalValueLockedUSD
    cumulativeUniqueUsers
  }
  markets(first: 25, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    name
    totalValueLockedUSD
    totalDepositBalanceUSD
    totalBorrowBalanceUSD
    inputToken { symbol decimals }
  }
  marketSnapshots: marketDailySnapshots(first: 50, orderBy: timestamp, orderDirection: desc) {
    timestamp
    totalValueLockedUSD
    dailyDepositUSD
    dailyBorrowUSD
    market { id }
  }
  protocolSnapshots: marketDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp
    totalValueLockedUSD
    dailyDepositUSD
    dailyBorrowUSD
    dailyLiquidateUSD
  }
}
`;

export const AAVE_V3_QUERY = `
query AaveV3BaseMetrics {
  reserves(first: 15, orderBy: totalLiquidity, orderDirection: desc) {
    symbol
    totalLiquidity
    paramsHistory(first: 30, orderBy: timestamp, orderDirection: desc) {
      timestamp
      totalLiquidity
    }
  }
}
`;

/** Last 1 hour on-chain lending activity — supplies, borrows, repays, withdraws, liquidations */
export const AAVE_V3_TRENDING_QUERY = `
query AaveV3HourlyTrending($oneHourAgo: Int!) {
  supplies(
    first: 1000
    where: { timestamp_gte: $oneHourAgo }
    orderBy: timestamp
    orderDirection: desc
  ) {
    timestamp
    amount
    assetPriceUSD
    reserve { symbol decimals }
  }
  borrows(
    first: 1000
    where: { timestamp_gte: $oneHourAgo }
    orderBy: timestamp
    orderDirection: desc
  ) {
    timestamp
    amount
    assetPriceUSD
    reserve { symbol decimals }
  }
  repays(
    first: 1000
    where: { timestamp_gte: $oneHourAgo }
    orderBy: timestamp
    orderDirection: desc
  ) {
    timestamp
    amount
    assetPriceUSD
    reserve { symbol decimals }
  }
  redeemUnderlyings(
    first: 1000
    where: { timestamp_gte: $oneHourAgo }
    orderBy: timestamp
    orderDirection: desc
  ) {
    timestamp
    amount
    assetPriceUSD
    reserve { symbol decimals }
  }
  liquidationCalls(
    first: 200
    where: { timestamp_gte: $oneHourAgo }
    orderBy: timestamp
    orderDirection: desc
  ) {
    timestamp
    collateralAmount
    principalAmount
    collateralAssetPriceUSD
    borrowAssetPriceUSD
    collateralReserve { symbol decimals }
    principalReserve { symbol decimals }
  }
}
`;

export const COMPOUND_V3_QUERY = `
query CompoundV3DailyMetrics {
  dailyProtocolAccountings(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp
    accounting {
      totalSupplyUsd
      totalBorrowUsd
    }
  }
}
`;

export function queryForKind(kind: GraphQueryKind): string {
  if (kind === "aave-v3-trending") return AAVE_V3_TRENDING_QUERY;
  if (kind === "aave-v3") return AAVE_V3_QUERY;
  if (kind === "compound-v3") return COMPOUND_V3_QUERY;
  return LENDING_QUERY_TEMPLATE;
}

export function queryBodyForKind(
  kind: GraphQueryKind = "messari",
): { query: string; variables?: Record<string, unknown> } {
  const query = queryForKind(kind);
  if (kind === "messari") {
    return { query, variables: { first: 1 } };
  }
  if (kind === "aave-v3-trending") {
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    return { query, variables: { oneHourAgo } };
  }
  return { query };
}

/** @deprecated Use queryBodyForKind */
export function composableQueryBody(): { query: string; variables: { first: number } } {
  return queryBodyForKind("messari") as { query: string; variables: { first: number } };
}
