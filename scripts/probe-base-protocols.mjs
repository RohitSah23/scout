import { config } from "dotenv";
config();
const key = process.env.GRAPH_GATEWAY_API_KEY;

async function q(id, label, query) {
  const res = await fetch(`https://gateway.thegraph.com/api/${key}/subgraphs/id/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  console.log("\n===", label, "===");
  if (json.errors?.length) console.log("ERR:", json.errors[0].message);
  else console.log(JSON.stringify(json.data, null, 2).slice(0, 2000));
  console.log("deploy:", json.extensions?.deployment ?? "none");
}

const aave = "GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF";
const compound = "2hcXhs36pTBDVUmk5K2Zkr6N4UYGwaHuco2a6jyTsijo";

await q(
  aave,
  "aave reserves history",
  `{ reserves(first: 10, orderBy: totalLiquidity, orderDirection: desc) {
    symbol totalLiquidity
    paramsHistory(first: 30, orderBy: timestamp, orderDirection: desc) { timestamp totalLiquidity }
  } }`,
);

await q(
  compound,
  "compound daily accounting",
  `{ dailyProtocolAccountings(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp totalSupply totalBorrow totalValueLockedUSD uniqueUsers
  } }`,
);

await q(
  compound,
  "compound type fields",
  `{ __type(name: "DailyProtocolAccounting") { fields { name } } }`,
);

await q(
  compound,
  "compound daily tvl",
  `{ dailyProtocolAccountings(first: 30, orderBy: timestamp, orderDirection: desc) {
    timestamp
    accounting { totalSupplyUsd totalBorrowUsd }
  } }`,
);
