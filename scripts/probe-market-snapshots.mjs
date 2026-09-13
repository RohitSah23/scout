// Throwaway probe: which per-market daily fields exist per Messari lending schema version?
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const key = env.match(/^GRAPH_GATEWAY_API_KEY=(.*)$/m)?.[1].trim();
if (!key) throw new Error("no GRAPH_GATEWAY_API_KEY");

const targets = [
  ["moonwell-base", "33ex1ExmYQtwGVwri1AP3oMFPGSce6YbocBP7fWbsBrg"],
  ["compound-v3-base", "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9"],
  ["seamless-protocol-base", "2u4mWUV4xS19ef1MbnxZHWLLMwdPxtVifH46JbonXwXP"],
  ["qidao-base", "9NHJ9k31qaGCYXppm9isJTiEoiB6v3tJDnR6SrQrxcjw"],
];

async function gql(id, query) {
  const res = await fetch(`https://gateway.thegraph.com/api/${key}/subgraphs/id/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

const INTROSPECT = `
query {
  __type(name: "MarketDailySnapshot") { fields { name } }
}`;

for (const [label, id] of targets) {
  console.log(`\n=== ${label} ===`);
  const r = await gql(id, INTROSPECT);
  if (r.errors) {
    console.log("  error:", r.errors[0].message.slice(0, 160));
    continue;
  }
  const names = (r.data?.__type?.fields ?? []).map((f) => f.name);
  const daily = names.filter((n) => /^daily/i.test(n));
  console.log("  daily* fields:", daily.join(", "));
  console.log("  has totalValueLockedUSD:", names.includes("totalValueLockedUSD"));
}
