/**
 * Generates packages/graph/src/messari-lending-catalog.json from Messari lending deployments.
 * Source: messari/subgraphs deployment/deployment.json (lending schema, prod status).
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEPLOYMENT_URL =
  "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json";

const NETWORK_TO_CHAIN = {
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon",
  bsc: "bsc",
  avalanche: "avalanche",
  fantom: "fantom",
  gnosis: "gnosis",
  moonbeam: "moonbeam",
  moonriver: "moonriver",
  scroll: "scroll",
  "blast-mainnet": "blast",
  linea: "linea",
  "zksync-era": "zksync",
  near: "near",
  aurora: "aurora",
  harmony: "harmony",
  cronos: "cronos",
  metis: "metis",
  "etherlink-mainnet": "etherlink",
  "xlayer-mainnet": "xlayer",
};

function parseMessariDeploymentJson(raw) {
  const entries = [];
  for (const [protocolKey, proto] of Object.entries(raw)) {
    if (proto.schema !== "lending") continue;
    for (const [messariSlug, dep] of Object.entries(proto.deployments ?? {})) {
      if (dep.status !== "prod") continue;
      const chain = dep.network ? NETWORK_TO_CHAIN[dep.network.toLowerCase()] ?? dep.network.toLowerCase() : undefined;
      const subgraphId = dep.services?.["decentralized-network"]?.["query-id"];
      if (!chain || !subgraphId) continue;
      entries.push({
        protocolKey,
        messariSlug,
        chain,
        subgraphId,
        schemaVersion: dep.versions?.schema ?? "1.0.0",
        methodologyVersion: dep.versions?.methodology ?? "1.0.0",
        queryKind: "messari",
      });
    }
  }
  return entries;
}

async function loadDeploymentJson() {
  const local = resolve(process.cwd(), ".tmp-deployment.json");
  if (existsSync(local)) {
    return JSON.parse(readFileSync(local, "utf8"));
  }
  const res = await fetch(DEPLOYMENT_URL);
  if (!res.ok) throw new Error(`Failed to fetch deployment.json: HTTP ${res.status}`);
  return res.json();
}

const catalog = parseMessariDeploymentJson(await loadDeploymentJson());
const out = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../packages/graph/src/messari-lending-catalog.json",
);
writeFileSync(out, JSON.stringify(catalog, null, 2));
console.log(`Wrote ${catalog.length} catalog entries to ${out}`);
