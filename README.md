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
| Live Subgraph MCP |        | Search & SERP MCP |        | Opportunity Matrix|
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
│   ├── web/               # Next.js 15 App Router Frontend (Chat UI, Radar Chart, Privy Wallet, SSE Stream)
│   ├── api/               # Hono REST & SSE Server (Research session runners, x402 endpoints, Bazantic recipes)
│   └── agent/             # Standalone CLI agent runner for headless research workflows
├── packages/
│   ├── agent-runtime/     # Core autonomous research loop and state machine
│   ├── graph/             # The Graph Subgraph MCP queries & Messari standardized schema resolvers
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

## 🚀 Quick Start & Initialization

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### 2. Installation

Clone the repository and install all monorepo dependencies:

```bash
git clone https://github.com/RohitSah23/scout.git
cd scout
npm install
```

### 3. Environment Configuration

Copy the sample environment file to `.env` in the root:

```bash
cp .env.example .env
```

Open `.env` and configure your API keys:

```env
# --- LLM (OpenRouter or OpenAI-compatible) ---
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://scout.local
OPENROUTER_SITE_NAME=Scout

# --- The Graph ---
GRAPH_GATEWAY_API_KEY=your_graph_gateway_api_key

# --- OpenSEO ---
OPENSEO_API_KEY=your_openseo_api_key

# --- x402 & Blockchain ---
X402_PAY_TO_ADDRESS=0x...
X402_FACILITATOR_API_KEY_ID=
X402_FACILITATOR_API_KEY_SECRET=
X402_PRIVATE_KEY=your_wallet_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# --- Privy ---
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# --- ENSv2 Sepolia ---
ENS_SEPOLIA_RPC_URL=https://rpc.sepolia.org
ENS_DEPLOYER_PRIVATE_KEY=
ENS_AGENT_PRIVATE_KEY=
ENS_PARENT_NAME=scout.eth

# --- Bazantic ---
BAZANTIC_API_KEY=your_bazantic_api_key

# --- API Server ---
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

*(Note: The runtime includes realistic fallback mocks for all integrations so you can run and test the complete pipeline even without live external API keys.)*

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
| **The Graph** | Live onchain protocol discovery & Messari standardized lending/CDP subgraphs (*"1 query × N protocols"*) | [`packages/graph`](packages/graph) |
| **OpenSEO** | Internet/search intelligence, keyword search volume, SERP rankings, and competitor gap metrics | [`packages/openseo`](packages/openseo) |
| **x402** | Machine-native HTTP 402 payment flow for deep analysis reports ($0.03 USDC on Base Sepolia) | [`packages/x402`](packages/x402) |
| **ENSv2** | Onchain agent identity (`scout.<project>.eth`), Permissioned Resolver & Enhanced Access Control | [`packages/ens`](packages/ens) |
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

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, data flow diagrams, and adapter design patterns.
- [docs/DEMO.md](docs/DEMO.md) — 3:30 Hackathon video script, sample prompts, and captured proof artifacts.
- [docs/PARTNERS.md](docs/PARTNERS.md) — Detailed integration technicalities for each partner prize.
- [docs/BOUNTIES.md](docs/BOUNTIES.md) — Target bounty checklist, eligibility criteria, and submission tracks.
- [docs/SECURITY.md](docs/SECURITY.md) — Treasury safety, Privy policy gates, and ENS access controls.
- [scout_ethonline2026_full_info_dump.md](scout_ethonline2026_full_info_dump.md) — Comprehensive master product specification.

---

## ⚖️ License

MIT License. Built with ❤️ for ETHOnline 2026.
