import { config } from "dotenv";
config();

const key = process.env.GRAPH_GATEWAY_API_KEY;
const id = "GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF";
const url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${id}`;

async function q(label, query, variables) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  console.log("\n===", label, "===");
  if (json.errors?.length) console.log("ERR:", json.errors[0].message);
  else console.log(JSON.stringify(json.data, null, 2).slice(0, 1200));
  return json;
}

await q(
  "reserves",
  `{ reserves(first: 3, orderBy: totalLiquidity, orderDirection: desc) { id name symbol totalLiquidity totalATokenSupply availableLiquidity } }`,
);

await q(
  "paramsHistory",
  `{ reserves(first: 1, orderBy: totalLiquidity, orderDirection: desc) {
    id name
    paramsHistory(first: 5, orderBy: timestamp, orderDirection: desc) { timestamp liquidityRate totalLiquidity }
  } }`,
);

await q(
  "pool",
  `{ pools { id totalLiquidity totalDebt totalSupply } }`,
);

await q(
  "introspection",
  `{ __schema { queryType { fields { name } } } }`,
);
