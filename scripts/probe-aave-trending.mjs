import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const key = process.env.GRAPH_GATEWAY_API_KEY;
const id = "GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF";
const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
const url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${id}`;

const trendingQuery = `
query AaveV3HourlyTrending($oneHourAgo: Int!) {
  supplies(first: 1000, where: { timestamp_gte: $oneHourAgo }, orderBy: timestamp, orderDirection: desc) {
    timestamp amount assetPriceUSD reserve { symbol decimals }
  }
  borrows(first: 1000, where: { timestamp_gte: $oneHourAgo }, orderBy: timestamp, orderDirection: desc) {
    timestamp amount assetPriceUSD reserve { symbol decimals }
  }
  repays(first: 1000, where: { timestamp_gte: $oneHourAgo }, orderBy: timestamp, orderDirection: desc) {
    timestamp amount assetPriceUSD reserve { symbol decimals }
  }
  redeemUnderlyings(first: 1000, where: { timestamp_gte: $oneHourAgo }, orderBy: timestamp, orderDirection: desc) {
    timestamp amount assetPriceUSD reserve { symbol decimals }
  }
  liquidationCalls(first: 200, where: { timestamp_gte: $oneHourAgo }, orderBy: timestamp, orderDirection: desc) {
    timestamp collateralAmount principalAmount collateralAssetPriceUSD borrowAssetPriceUSD
    collateralReserve { symbol decimals } principalReserve { symbol decimals }
  }
}
`;

function amountToUsd(amount, decimals, priceUsd) {
  const raw = parseFloat(amount ?? "0");
  const dec = decimals ?? 18;
  const price = parseFloat(priceUsd ?? "0");
  if (raw <= 0 || price <= 0) return 0;
  return (raw / 10 ** dec) * price;
}

function aggregate(payload) {
  const stats = new Map();
  const add = (symbol, usd, field) => {
    if (!symbol || usd <= 0) return;
    const row = stats.get(symbol) ?? {
      supplyUsd: 0,
      withdrawUsd: 0,
      borrowUsd: 0,
      repayUsd: 0,
      liquidationUsd: 0,
      txCount: 0,
    };
    row[field] += usd;
    row.txCount += 1;
    stats.set(symbol, row);
  };

  for (const e of payload.supplies ?? []) {
    add(e.reserve?.symbol, amountToUsd(e.amount, e.reserve?.decimals, e.assetPriceUSD), "supplyUsd");
  }
  for (const e of payload.borrows ?? []) {
    add(e.reserve?.symbol, amountToUsd(e.amount, e.reserve?.decimals, e.assetPriceUSD), "borrowUsd");
  }
  for (const e of payload.repays ?? []) {
    add(e.reserve?.symbol, amountToUsd(e.amount, e.reserve?.decimals, e.assetPriceUSD), "repayUsd");
  }
  for (const e of payload.redeemUnderlyings ?? []) {
    add(e.reserve?.symbol, amountToUsd(e.amount, e.reserve?.decimals, e.assetPriceUSD), "withdrawUsd");
  }

  const rows = [];
  for (const [symbol, s] of stats) {
    const netInflowUsd = s.supplyUsd - s.withdrawUsd;
    const grossFlowUsd = s.supplyUsd + s.withdrawUsd + s.borrowUsd + s.repayUsd + s.liquidationUsd;
    const trendingScore = netInflowUsd + 0.5 * s.borrowUsd + 2.0 * s.liquidationUsd;
    if (s.txCount < 3 || grossFlowUsd < 10_000) continue;
    rows.push({ symbol, trendingScore, grossFlowUsd, txCount: s.txCount });
  }
  return rows.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 10);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: trendingQuery, variables: { oneHourAgo } }),
});
const json = await res.json();
if (json.errors?.length) {
  console.error("ERR:", json.errors[0].message);
  process.exit(1);
}

const trending = aggregate(json.data);
console.log(`1h trending on Aave V3 Base (${trending.length} assets):`);
for (const row of trending) {
  console.log(
    `  ${row.symbol}: score=${row.trendingScore.toFixed(0)} flow=$${row.grossFlowUsd.toFixed(0)} txs=${row.txCount}`,
  );
}
