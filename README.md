# Scout — Autonomous Protocol Intelligence Agent

> **ETHOnline 2026 Hackathon Project**  
> Scout bridges on-chain protocol activity and live web search demand through an autonomous AI research agent that pays for deep data using machine-native micropayments, operates with on-chain identity and access controls, and enforces treasury spending policies.

---

## 🌟 Overview

Crypto protocols live in two separate worlds:
1. **On-Chain Activity** (What contracts and users are actually doing) — *powered by The Graph*
2. **Web & Search Market Demand** (What developers and searchers are looking for) — *powered by OpenSEO*

**Scout** is an autonomous AI analyst that ingests live data across both dimensions, calculates a multi-factor **Opportunity Score**, identifies information gaps, and autonomously buys deep analytical reports using **x402 micropayments** under strict **Privy policy-gated treasuries** and **ENSv2 onchain agent identities**.

```
                           +------------------------+
                           |      User Prompt       |
                           |   "Analyze Base..."    |
                           +-----------+------------+
                                       |
                                       v
                    +--------------------------------------+
                    |      @scout/agent-runtime Loop       |
                    +------------------+-------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+-------------------+        +-------------------+        +-------------------+
|     The Graph     |        |      OpenSEO      |        |     Scoring       |
| Live Graph Gateway |        | Search & SERP MCP |        | Opportunity Matrix|
+-------------------+        +-------------------+        +---------+---------+
                                                                    |
                                                      Uncertainty Gate Triggered
                                                                    |
                                                                    v
                                                          +-------------------+
                                                          |  x402 Micropayment|
                                                          | Privy Policy Gated|
                                                          +---------+---------+
                                                                    |
                                                                    v
                                                          +-------------------+
                                                          |    ENSv2 Record   |
                                                          | Status & Attest   |
                                                          +---------+---------+
                                                                    |
                                                                    v
                                                          +-------------------+
                                                          | Recommendation UI |
                                                          | Next.js + SSE Log |
                                                          +-------------------+
```

---

## 🏗️ Monorepo Architecture

```text
scout/
├── apps/
│   ├── web/               # Next.js 15 App Router Frontend (Research, Reports, Agent, SSE Timeline, Payment UX)
│   ├── api/               # Hono REST & SSE Server (Research session runners, x402 endpoints, Bazantic recipes)
│   └── agent/             # Standalone CLI agent runner for headless research workflows
├── packages/
│   ├── agent-runtime/     # Core autonomous research loop and state machine
│   ├── graph/             # The Graph gateway queries & Messari standardized schema resolvers
│   ├── openseo/           # OpenSEO MCP client for keyword research, SERP, and domain authority
│   ├── scoring/           # Deterministic 6-dimension Opportunity Score & Uncertainty Gate
│   ├── x402/              # HTTP 402 client/facilitator for autonomous USDC micropayments
│   ├── privy/             # Embedded wallet treasury integration & spending policy enforcement
│   ├── ens/               # ENSv2 subname resolution, Permissioned Resolver & EAC permissions
│   ├── bazantic/          # Bazantic tool definitions & research Recipe manifest
│   ├── llm/               # OpenRouter / OpenAI-compatible LLM narration client
│   ├── schemas/           # Shared Zod schemas, session types, and adapter interfaces
│   └── hedera/            # Backup / fallback consensus & attestation adapter
├── services/
│   └── deep-analysis/     # x402-gated microservice providing premium protocol risk/growth reports
└── docs/                  # In-depth architectural, bounty, demo, and security documentation
```

---

## ✅ Verified Live Hackathon Proof

All proof below was produced by real APIs and public testnet transactions on September 11, 2026. Scout has no simulated settlement or synthetic ENS receipt path.

### Public production deployment

| Surface | Public endpoint | Verification |
|---|---|---|
| Web dashboard | [scout-web-ethglobal-2026.onrender.com](https://scout-web-ethglobal-2026.onrender.com) | Render service is live; production Next.js UI loads and Privy becomes ready |
| API health | [`/health`](https://scout-api-ethglobal-2026.onrender.com/health) | Returns `{"ok":true,"service":"scout-api"}` |
| Agent identity | [`/agent/identity`](https://scout-api-ethglobal-2026.onrender.com/agent/identity) | Resolves `scout-agent.eth`, EAC permissions, records and the onchain budget |
| MCP server | [`/mcp`](https://scout-api-ethglobal-2026.onrender.com/mcp) | Stateless Streamable HTTP MCP server exposing `protocol_opportunity_analysis` |
| OpenAPI | [`/openapi.json`](https://scout-api-ethglobal-2026.onrender.com/openapi.json) | Machine-readable research and x402 service contract |

Both Render services deploy from the public `dev` branch. The versioned [`render.yaml`](render.yaml) contains the complete two-service topology while credentials remain only in Render's encrypted environment.

### Public end-to-end production run

The [replayable production report](https://scout-web-ethglobal-2026.onrender.com/research/f28e5c0e-0081-435c-8cad-18b60713534f) queried five live Base lending subgraphs, composed one Messari template across four protocols, ranked 16 assets, completed OpenSEO enrichment, triggered the uncertainty gate, and bought candidate-specific evidence through the deployed x402 endpoint. The Privy policy-approved payment settled [on Base Sepolia](https://sepolia.basescan.org/tx/0xe3bd6a4311c7b5cf49372e1f0bb58905a7b3f9b8c5e8b371c5672cac2307356b) for 0.03 USDC. The final report selected cbBTC on Aave V3 with a 52.0 opportunity score, 30 risk score, 100% evidence confidence and 21 evidence sources.

### Network separation

| Flow | Network | Purpose |
|---|---|---|
| Privy + x402 | Base Sepolia (chain 84532) | Policy-controlled USDC payment for paid research |
| ENSv2 | Ethereum Sepolia (chain 11155111) | Agent identity, records and Enhanced Access Control |

Base Sepolia ETH/USDC cannot be treated as Ethereum Sepolia gas; the two proof flows use separate wallets and explorers.

### The Graph — composable standardized data

The same [LENDING_QUERY_TEMPLATE](packages/graph/src/queries.ts) runs against five Messari Lending/CDP deployments on Base:

| Protocol | Graph subgraph/deployment ID | Schema |
|---|---|---|
| Moonwell | 33ex1ExmYQtwGVwri1AP3oMFPGSce6YbocBP7fWbsBrg | Messari Lending/CDP 2.0.1 |
| Seamless Protocol | 2u4mWUV4xS19ef1MbnxZHWLLMwdPxtVifH46JbonXwXP | Messari Lending/CDP 3.1.0 |
| Compound V3 | AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9 | Messari Lending/CDP 3.1.0 |
| QiDao | 9NHJ9k31qaGCYXppm9isJTiEoiB6v3tJDnR6SrQrxcjw | Messari Lending/CDP 1.3.0 |
| Aave V3 | D7mapexM5ZsQckLJai2FawTKXJ7CqYGKM8PErnS3cJi9 | Messari Lending/CDP 3.1.0 |

A separate Aave V3 native subgraph (GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF, deployment QmXZ53Kzz3L2LvvbGve2ebtLKWMhjjB1a3U2jnUj2YwGCW) supplies one-hour event-level trending data. The verified paid run evaluated 16 token/market candidates from 20 initial sources and selected cbBTC on Aave V3 with opportunity score 53.7 and risk score 30.

### Privy + x402 — real financial flow

| Proof | Value |
|---|---|
| Privy policy-controlled payer | [0x38B28037192d6b44B537c2c6F717f150a1989E69](https://sepolia.basescan.org/address/0x38B28037192d6b44B537c2c6F717f150a1989E69) |
| Attached Privy policy ID | eebmveuo1rtadd1pua6vll2x |
| Policy boundary | Base Sepolia USDC EIP-3009 only; allowlisted payee; maximum 0.10 USDC |
| Payee | [0xb92fe771ed8233e5198bf3e61f2f811d90bd524c](https://sepolia.basescan.org/address/0xb92fe771ed8233e5198bf3e61f2f811d90bd524c) |
| Wallet funding swap | [0x7c771bbf…beff1](https://sepolia.basescan.org/tx/0x7c771bbf6b70ea8b2e3ef229344f924b3bd7ac869462c09f68ef2ccfaf3beff1) — real Uniswap v3 conversion to test USDC |
| x402 settlement | [0xb66194b3…df537](https://sepolia.basescan.org/tx/0xb66194b37432059c1fba839d66e924281ed5984a5580c6ca2d9ad342a11df537) — 0.03 USDC |
| Production Render settlement | [0xe3bd6a43…07356b](https://sepolia.basescan.org/tx/0xe3bd6a4311c7b5cf49372e1f0bb58905a7b3f9b8c5e8b371c5672cac2307356b) — 0.03 USDC |

The final research session and UI preserve the payer, payee, amount, network, policy ID, service URL, timestamp, settlement hash and Basescan link in a structured payment receipt.

### ENSv2 — identity and scoped EAC

| Proof | Value |
|---|---|
| ENS identity | scout-agent.eth |
| Owner/admin Privy wallet | [0x086f394bDBcD662dC2B1b467D7984827D39881bD](https://sepolia.etherscan.io/address/0x086f394bDBcD662dC2B1b467D7984827D39881bD) |
| Scoped agent Privy wallet / resolved address | [0x9BCBB965C4886dDc4ab769f6141a1Ea26a593eaE](https://sepolia.etherscan.io/address/0x9BCBB965C4886dDc4ab769f6141a1Ea26a593eaE) |
| Unauthorized test Privy wallet | [0x2804EA295DB26Fa81099D2326974D400D62d5413](https://sepolia.etherscan.io/address/0x2804EA295DB26Fa81099D2326974D400D62d5413) |
| Permissioned Resolver proxy | [0x846e68ecd4fEe028C776bf5642D242De762b9dbd](https://sepolia.etherscan.io/address/0x846e68ecd4fEe028C776bf5642D242De762b9dbd) |

Real ENSv2 transaction sequence:

1. [Resolver proxy deployment](https://sepolia.etherscan.io/tx/0x191648c90c3b4ca18aa610cccf69fff12e4908b9e5eafcc24b1e6d3f8bdd3cfc) through the official Verifiable Factory.
2. [MockUSDC mint](https://sepolia.etherscan.io/tx/0x38f83f35e145b493f4a91dced51c4c7e8765e91378977105f7d0aa470b4ba6bc) and [registrar approval](https://sepolia.etherscan.io/tx/0xdf98999be3c63852da3b0b30225258d713525fdc96a191e267fa5b707ab48f93).
3. [Commit](https://sepolia.etherscan.io/tx/0xd191da835718dfa44e90088037361a296b6563cbcc5fe8475331ea3f195d5c5e) and, after the mandatory reveal delay, [register scout-agent.eth](https://sepolia.etherscan.io/tx/0x083ac4693d6b38c3052b8e6b20107c55d1b8281dee8cb457cde1934773174231).
4. [Initialize address/identity records and delegate EAC roles](https://sepolia.etherscan.io/tx/0x5cc3ec6dfc7cbcdc2c5e67d06068e6306c43391aacd4ed825ba0ba8467de6f8d).
5. [Scoped agent write succeeds](https://sepolia.etherscan.io/tx/0x2b65dbcf1de552eb8c31ad20d39a84107d6c59fe0b85f572c36461b8a1a0235b).
6. [Unauthorized write is mined and reverts](https://sepolia.etherscan.io/tx/0xebc0c9435af2af0c1146d28b03b526082dd50b3c0556709254f95ae0fec2f831).
7. [Production MCP record update](https://sepolia.etherscan.io/tx/0x968cc1b7fc77a268815be40e55d2d197b11ebdcbb1015f88216c904467e22665) sets `agent.mcp` to `https://scout-api-ethglobal-2026.onrender.com/mcp`.

Verified resolver state:

- addr(scout-agent.eth) = 0x9BCBB965C4886dDc4ab769f6141a1Ea26a593eaE
- agent.type = autonomous-research
- research.budget = 0.50
- research.status = ready
- research.lastReport = provisioning-proof
- agent.mcp = https://scout-api-ethglobal-2026.onrender.com/mcp
- Agent holds record-specific ROLE_SET_TEXT for research.status and research.lastReport
- Agent does not hold root-level text permission

Scout discovers the current resolver before every write, verifies forward resolution, reads actual EAC bitmaps, and resolves research.budget before authorizing an x402 purchase. ENS is therefore an enforced runtime control, not decorative metadata.

## 🚀 Quick Start & Initialization

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### 2. Installation

Clone the repository and install all monorepo dependencies:

```bash
git clone https://github.com/8dazo/scout.git
cd scout
npm install
```

### 3. Environment Configuration

Copy the sample environment file to `.env` in the root:

```bash
cp .env.example .env
```

Open `.env` and configure your API keys. See **[docs/API_KEYS.md](docs/API_KEYS.md)** for where to obtain each credential (OpenRouter, The Graph, OpenSEO, Privy, x402/CDP, ENS Sepolia, Bazantic).

*(Note: Research requires live `GRAPH_GATEWAY_API_KEY`, `OPENSEO_API_KEY`, and `OPENROUTER_API_KEY`. x402, Privy payments, and ENS fail closed until their live wallet and resolver configuration is present.)*

---

## 💻 Running the Application

### Build All Packages
Compile all packages and TypeScript declarations across the monorepo:
```bash
npm run build
```

### Run in Development Mode
Start the web dashboard (`localhost:3000`) and the API server (`localhost:3001`) in parallel:
```bash
npm run dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

### Run Standalone CLI Agent
Execute an autonomous research session directly from the command line:
```bash
node apps/agent/dist/index.js "Analyze lending protocols on Base. Best developer opportunity?"
```

---

## 🎯 Partner Integrations & Bounty Alignment

| Partner | Role in Scout | Key Code Package |
|---|---|---|
| **The Graph** | Live onchain protocol discovery & Messari standardized lending/CDP subgraphs (*"1 query × N protocols"*); each protocol query fetches **top 5 markets** (`inputToken`, TVL, 7d snapshots) and flattens into a **cross-protocol token leaderboard** (Aave uses native 1h trending) | [`packages/graph`](packages/graph) |
| **OpenSEO** | Internet/search intelligence, keyword search volume, SERP rankings, and competitor gap metrics | [`packages/openseo`](packages/openseo) |
| **x402** | Machine-native HTTP 402 payment flow for deep analysis reports ($0.03 USDC on Base Sepolia) | [`packages/x402`](packages/x402) |
| **ENSv2** | Onchain agent identity (scout-agent.eth), Permissioned Resolver, record-scoped Enhanced Access Control, and onchain treasury cap | [`packages/ens`](packages/ens) |
| **Privy** | Organization treasury embedded wallet, spending policies (per-tx caps, domain allowlists) | [`packages/privy`](packages/privy) |
| **Bazantic** | Gateway manifest & reusable recipes exposing Scout's intelligence to downstream autonomous agents | [`packages/bazantic`](packages/bazantic) |
| **Hedera** | Fallback consensus & verifiable audit trail integration | [`packages/hedera`](packages/hedera) |

---

## 📊 Opportunity Scoring Model

Scout scores protocols across **6 core dimensions** (0–100 scale):

1. **Onchain Growth (25%)**: TVL growth rate, active borrower momentum, liquidation stability.
2. **Web & Search Demand (20%)**: Search volume growth, keyword intent, traffic trajectory.
3. **Competitor Gap (20%)**: Content/SERP weaknesses of incumbent competitors.
4. **Developer Moat (15%)**: Integration surface, SDK quality, smart contract composability.
5. **Protocol Health (10%)**: Collateralization ratio stability and bad debt resistance.
6. **Risk Penalty (10%)**: Smart contract audit status, oracle centralization, regulatory flags.

### The Uncertainty Gate
If the top two protocols have an Opportunity Score difference of `< 10 points` and overall confidence is `< 75%`, Scout's **Uncertainty Gate** automatically triggers an **x402 deep-analysis micro-purchase** to break the tie with granular risk telemetry.

---

## 🛠️ Monorepo Scripts

- `npm run dev` — Start Next.js web and Hono API concurrently with hot reloading.
- `npm run build` — Build all packages with Turborepo dependency caching.
- `npm run test` — Run unit and integration test suites.
- `npm run lint` — Lint code across all workspaces.

---

## 📚 Documentation Directory

- [docs/API_KEYS.md](docs/API_KEYS.md) — Where to obtain every credential in `.env.example`.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, data flow diagrams, and adapter design patterns.
- [docs/DEMO.md](docs/DEMO.md) — 3:30 Hackathon video script, sample prompts, and captured proof artifacts.
- [docs/PARTNERS.md](docs/PARTNERS.md) — Detailed integration technicalities for each partner prize.
- [docs/BOUNTIES.md](docs/BOUNTIES.md) — Target bounty checklist, eligibility criteria, and submission tracks.
- [docs/SECURITY.md](docs/SECURITY.md) — Treasury safety, Privy policy gates, and ENS access controls.
- [scout_ethonline2026_full_info_dump.md](scout_ethonline2026_full_info_dump.md) — Comprehensive master product specification.

---

## ⚖️ License

MIT License. Built with ❤️ for ETHOnline 2026.
