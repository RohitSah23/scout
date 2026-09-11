import type { GraphQueryKind, MessariDeployment } from "@scout/schemas";
import bundledCatalog from "./messari-lending-catalog.json" with { type: "json" };

export interface CatalogEntry {
  protocolKey: string;
  messariSlug: string;
  chain: string;
  subgraphId: string;
  schemaVersion: string;
  methodologyVersion?: string;
  queryKind?: GraphQueryKind;
  deploymentId?: string;
}

const MESSARI_DEPLOYMENT_URL =
  "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json";

const NETWORK_TO_CHAIN: Record<string, string> = {
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

const PROTOCOL_LABELS: Record<string, string> = {
  "aave-amm": "Aave AMM",
  "aave-arc": "Aave Arc",
  "aave-rwa": "Aave RWA",
  "aave-v2": "Aave V2",
  "aave-v3": "Aave V3",
  abracadabra: "Abracadabra",
  "alpaca-finance-lending": "Alpaca Finance",
  "banker-joe": "Banker Joe",
  "bastion-protocol": "Bastion Protocol",
  benqi: "Benqi",
  burrow: "Burrow",
  "compound-v2": "Compound V2",
  "compound-v3": "Compound V3",
  "cream-finance": "Cream Finance",
  dforce: "dForce",
  "euler-finance": "Euler Finance",
  "geist-finance": "Geist Finance",
  goldfinch: "Goldfinch",
  "inverse-finance": "Inverse Finance",
  "iron-bank": "Iron Bank",
  liquity: "Liquity",
  makerdao: "MakerDAO",
  "maple-finance-v1": "Maple Finance V1",
  "maple-finance-v2": "Maple Finance V2",
  moonwell: "Moonwell",
  "morpho-aave-v2": "Morpho Aave V2",
  "morpho-aave-v3": "Morpho Aave V3",
  "morpho-compound": "Morpho Compound",
  "notional-finance": "Notional Finance",
  "pac-finance": "Pac Finance",
  qidao: "QiDao",
  radiant: "Radiant Capital",
  "rari-fuse": "Rari Fuse",
  scream: "Scream",
  "seamless-protocol": "Seamless Protocol",
  seismic: "Seismic",
  "sonne-finance": "Sonne Finance",
  "spark-lend": "Spark Lend",
  truefi: "TrueFi",
  "uwu-lend": "UwU Lend",
  venus: "Venus",
  "vesta-finance": "Vesta Finance",
  zerolend: "ZeroLend",
  "morpho-blue": "Morpho Blue",
};

/** Native / community subgraphs not in Messari deployment.json */
const NATIVE_EXTRAS: CatalogEntry[] = [
  {
    protocolKey: "aave-v3",
    messariSlug: "aave-v3-base-native",
    chain: "base",
    subgraphId: "GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF",
    deploymentId: "QmXZ53Kzz3L2LvvbGve2ebtLKWMhjjB1a3U2jnUj2YwGCW",
    schemaVersion: "0.0.5",
    methodologyVersion: "1.1.0",
    queryKind: "aave-v3-trending",
  },
  {
    protocolKey: "compound-v3",
    messariSlug: "compound-v3-base-community",
    chain: "base",
    subgraphId: "2hcXhs36pTBDVUmk5K2Zkr6N4UYGwaHuco2a6jyTsijo",
    deploymentId: "QmT7JTVaR2mQplaceholder",
    schemaVersion: "1.0.3",
    methodologyVersion: "1.0.0",
    queryKind: "compound-v3",
  },
];

let cachedCatalog: CatalogEntry[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function protocolLabel(protocolKey: string): string {
  return PROTOCOL_LABELS[protocolKey] ?? protocolKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeChain(network: string): string | undefined {
  return NETWORK_TO_CHAIN[network.toLowerCase()] ?? network.toLowerCase();
}

export function parseMessariDeploymentJson(raw: unknown): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const root = raw as Record<
    string,
    {
      schema?: string;
      deployments?: Record<
        string,
        {
          network?: string;
          status?: string;
          versions?: { schema?: string; methodology?: string };
          services?: { "decentralized-network"?: { "query-id"?: string } };
        }
      >;
    }
  >;

  for (const [protocolKey, proto] of Object.entries(root)) {
    if (proto.schema !== "lending") continue;
    for (const [messariSlug, dep] of Object.entries(proto.deployments ?? {})) {
      if (dep.status !== "prod") continue;
      const chain = dep.network ? normalizeChain(dep.network) : undefined;
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

async function loadCatalogEntries(): Promise<CatalogEntry[]> {
  const now = Date.now();
  if (cachedCatalog && now < cacheExpiresAt) {
    return cachedCatalog;
  }

  try {
    const res = await fetch(MESSARI_DEPLOYMENT_URL, {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const parsed = parseMessariDeploymentJson(await res.json());
      if (parsed.length > 0) {
        cachedCatalog = parsed;
        cacheExpiresAt = now + CACHE_TTL_MS;
        return cachedCatalog;
      }
    }
  } catch {
    // Fall back to bundled catalog when offline or Messari is unreachable.
  }

  cachedCatalog = bundledCatalog as CatalogEntry[];
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedCatalog;
}

function toDeployment(entry: CatalogEntry): MessariDeployment {
  return {
    protocol: protocolLabel(entry.protocolKey),
    chain: entry.chain,
    subgraphId: entry.subgraphId,
    deploymentId: entry.deploymentId ?? entry.subgraphId,
    schemaVersion: entry.schemaVersion,
    methodologyVersion: entry.methodologyVersion ?? "1.0.0",
    queryKind: entry.queryKind ?? "messari",
    category: "lending-cdp",
    messariSlug: entry.messariSlug,
  };
}

function deploymentRank(d: MessariDeployment): number {
  switch (d.queryKind) {
    case "aave-v3-trending":
      return 10;
    case "aave-v3":
      return 5;
    case "messari":
      return 3;
    case "compound-v3":
      return 2;
    default:
      return 0;
  }
}

/** Prefer native adapters (Aave 1h trending) over duplicate Messari deployments per protocol+chain. */
function dedupeByProtocolChain(deployments: MessariDeployment[]): MessariDeployment[] {
  const byKey = new Map<string, MessariDeployment>();
  for (const d of deployments) {
    const key = `${d.protocol.toLowerCase()}|${d.chain}`;
    const existing = byKey.get(key);
    if (!existing || deploymentRank(d) > deploymentRank(existing)) {
      byKey.set(key, d);
    }
  }
  return [...byKey.values()];
}

export async function discoverDeployments(chain?: string): Promise<MessariDeployment[]> {
  const catalogEntries = await loadCatalogEntries();
  const merged = dedupeByProtocolChain([...catalogEntries, ...NATIVE_EXTRAS].map(toDeployment));

  if (chain) {
    return merged.filter((d) => d.chain.toLowerCase() === chain.toLowerCase());
  }
  return merged;
}

/** Sync snapshot for tests and offline tooling */
export function discoverDeploymentsBundled(chain?: string): MessariDeployment[] {
  const merged = dedupeByProtocolChain(
    [...(bundledCatalog as CatalogEntry[]), ...NATIVE_EXTRAS].map(toDeployment),
  );
  if (chain) {
    return merged.filter((d) => d.chain.toLowerCase() === chain.toLowerCase());
  }
  return merged;
}
