import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const key = process.env.GRAPH_GATEWAY_API_KEY;
if (!key) {
  console.error("MISSING GRAPH_GATEWAY_API_KEY");
  process.exit(1);
}

const lendingQuery = `
query LendingProtocolMetrics($first: Int!) {
  protocols(first: $first) {
    id name slug schemaVersion methodologyVersion
    totalValueLockedUSD cumulativeVolumeUSD cumulativeUniqueUsers
    totalDepositBalanceUSD totalBorrowBalanceUSD
  }
  marketDailySnapshots(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp totalValueLockedUSD dailyActiveUsers
    dailyDepositVolumeUSD dailyBorrowVolumeUSD dailyLiquidateVolumeUSD
  }
}`;

async function run(label, subgraphId) {
  const url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${subgraphId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: lendingQuery, variables: { first: 5 } }),
  });
  const json = await res.json();
  console.log(`\n--- ${label} ---`);
  console.log("HTTP", res.status);
  if (json.errors?.length) console.log("error:", json.errors[0].message);
  console.log("protocols:", json.data?.protocols?.length ?? 0);
  console.log("snapshots:", json.data?.marketDailySnapshots?.length ?? 0);
  console.log("deployment:", json.extensions?.deployment ?? "none");
}

await run("registry ID (wrong)", "GQFbbysmNSjvKxD1i1pE9FXGryth5f1ixKvovMo4s8h");
await run("Graph Explorer Aave V3 Base", "GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF");
