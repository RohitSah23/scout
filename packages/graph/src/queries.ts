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
  marketDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
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

export function queryForKind(kind: GraphQueryKind): string {
  if (kind === "aave-v3") return AAVE_V3_QUERY;
  return LENDING_QUERY_TEMPLATE;
}

export function queryBodyForKind(
  kind: GraphQueryKind = "messari",
): { query: string; variables?: Record<string, unknown> } {
  const query = queryForKind(kind);
  if (kind === "messari") {
    return { query, variables: { first: 1 } };
  }
  return { query };
}

/** @deprecated Use queryBodyForKind */
export function composableQueryBody(): { query: string; variables: { first: number } } {
  return queryBodyForKind("messari") as { query: string; variables: { first: number } };
}
