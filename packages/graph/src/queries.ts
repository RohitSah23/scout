import type { GraphQueryKind } from "@scout/schemas";

export const LENDING_QUERY_TEMPLATE = `
query LendingProtocolMetrics($first: Int!) {
  protocols(first: $first) {
    id
    name
    slug
    schemaVersion
    methodologyVersion
    totalValueLockedUSD
    cumulativeVolumeUSD
    cumulativeUniqueUsers
    totalDepositBalanceUSD
    totalBorrowBalanceUSD
  }
  marketDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp
    totalValueLockedUSD
    dailyActiveUsers
    dailyDepositVolumeUSD
    dailyBorrowVolumeUSD
    dailyLiquidateVolumeUSD
  }
}
`;

export const LENDING_QUERY_FALLBACK = `
query ProtocolOverview {
  financialMetricsDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp
    totalValueLockedUSD
    dailyActiveUsers
    dailyTransactionCount
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
  switch (kind) {
    case "aave-v3":
      return AAVE_V3_QUERY;
    case "compound-v3":
      return COMPOUND_V3_QUERY;
    default:
      return LENDING_QUERY_TEMPLATE;
  }
}
