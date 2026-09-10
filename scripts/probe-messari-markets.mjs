import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const key = process.env.GRAPH_GATEWAY_API_KEY;
const deployments = [
  { label: "Moonwell", id: "33ex1ExmYQtwGVwri1AP3oMFPGSce6YbocBP7fWbsBrg" },
  { label: "Seamless", id: "2u4mWUV4xS19ef1MbnxZHWLLMwdPxtVifH46JbonXwXP" },
  { label: "QiDao", id: "9NHJ9k31qaGCYXppm9isJTiEoiB6v3tJDnR6SrQrxcjw" },
];

const query = `
query MessariTopMarkets($first: Int!) {
  protocols(first: $first) { id name }
  markets(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id name totalValueLockedUSD inputToken { symbol }
  }
  marketSnapshots: marketDailySnapshots(first: 50, orderBy: timestamp, orderDirection: desc) {
    timestamp totalValueLockedUSD dailyDepositUSD dailyBorrowUSD market { id }
  }
}
`;

async function probe(label, id) {
  const url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${id}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { first: 1 } }),
  });
  const json = await res.json();
  console.log(`\n=== ${label} ===`);
  if (json.errors?.length) {
    console.log("ERR:", json.errors[0].message);
    return;
  }
  for (const m of json.data?.markets ?? []) {
    const snaps = (json.data?.marketSnapshots ?? []).filter((s) => s.market?.id === m.id);
    console.log(
      `  ${m.inputToken?.symbol} TVL=$${parseFloat(m.totalValueLockedUSD ?? 0).toFixed(0)} snapshots=${snaps.length}`,
    );
  }
}

for (const d of deployments) {
  await probe(d.label, d.id);
}
