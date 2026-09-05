# Scout — ETHOnline 2026 Hackathon Strategy & Full E2E Product Specification

> **Working name:** Scout  
> **Product:** Autonomous Protocol Intelligence Agent  
> **Core idea:** An AI agent researches Web3 protocols using live on-chain data from The Graph and live web/search intelligence from OpenSEO, can autonomously pay for additional data/services with x402, has an onchain identity and permissions through ENSv2, and uses Privy for wallet/authentication and controlled financial actions. Bazantic is added as an optional agent-service/recipe layer and fallback bounty path.

**Document date:** September 5, 2026  
**Target event:** ETHOnline 2026  
**Primary strategy:** Build one coherent product with multiple partner integrations, then choose the strongest three partner submissions at the end rather than hard-coding exactly three integrations from day one.

---

# 1. Executive Summary

Scout is an autonomous AI research agent for Web3 protocols.

A user gives Scout a natural-language task such as:

> “Analyze the leading lending protocols on Base and tell me where there is an opportunity to build.”

Scout does not simply display blockchain data.

It:

1. Identifies the information required.
2. Discovers and queries relevant live blockchain datasets through The Graph/Subgraph MCP.
3. Uses OpenSEO to investigate web/search/competitor demand.
4. Determines whether it needs additional paid information.
5. Uses a controlled wallet to make an x402 payment when a service requires payment.
6. Uses ENSv2 to give the agent an identity, namespace, and delegated permissions.
7. Uses Privy for the wallet/user experience and controlled financial actions.
8. Combines the information and reasons over it.
9. Produces a final opportunity/risk/market recommendation.
10. Records what it spent, why it spent it, and what evidence supported the recommendation.

The core product story is:

> **The Graph tells the agent what is happening on-chain. OpenSEO tells it what is happening on the web. x402 lets it buy additional information. ENS gives the agent identity and permissions. Privy provides secure wallet infrastructure and user-facing financial flows. Bazantic can turn our services/APIs into agent-readable tools and recipes.**

---

# 2. The Product in Very Simple Language

Imagine Scout is a junior analyst who has:

- a wallet,
- a name,
- a limited company research budget,
- access to blockchain databases,
- access to internet/search intelligence,
- and the ability to buy extra reports when necessary.

You tell Scout:

> “Find out whether Protocol X is worth building around.”

Scout behaves like this:

```text
You ask a question
        ↓
Scout decides what it needs to know
        ↓
Looks at blockchain activity
        ↓
Looks at internet/search activity
        ↓
Finds a gap or needs deeper evidence
        ↓
Pays for extra data
        ↓
Combines everything
        ↓
Makes a recommendation
        ↓
Shows evidence + score + cost
```

The important difference is that Scout is not just a dashboard.

It is an **agent that decides what data it needs and acts on that information.**

---

# 3. The Core Product Problem

Crypto has two different realities:

## A. What is actually happening on-chain?

Examples:

- Is usage increasing?
- Are active wallets increasing?
- Is volume growing?
- Is liquidity growing?
- Are users returning?
- Which contracts/protocols are gaining traction?

This is where **The Graph** fits.

## B. What is happening in the broader internet/market?

Examples:

- Are people searching for the protocol?
- Which competitors dominate search?
- What keywords are growing?
- Are competitors ranking?
- What content gaps exist?
- Is the protocol under-marketed?

This is where **OpenSEO** fits.

## C. How does an autonomous agent get more information?

Traditional APIs usually assume a human developer owns API keys and subscriptions.

Scout needs machine-native payments.

This is where **x402** fits.

## D. Who is the agent?

A raw wallet address is difficult to reason about and permissions need to be explicit.

This is where **ENSv2** fits.

## E. Where does the money/wallet come from?

The user needs a clean wallet experience and the agent needs controlled wallet actions.

This is where **Privy** fits.

## F. How do we make our own services understandable to agents?

We can expose our internal research APIs as agent-readable tools and create reusable Recipes.

This is where **Bazantic** fits.

---

# 4. The Main Product Flow

```text
                              USER
                               |
                               v
                     +-------------------+
                     |   SCOUT AI AGENT   |
                     +---------+---------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
        +-----------+    +-----------+    +-----------+
        | THE GRAPH |    |  OpenSEO  |    |   ENSv2   |
        | On-chain  |    | Web/SEO   |    | Identity  |
        +-----+-----+    +-----+-----+    +-----+-----+
              |                |                |
              +----------------+----------------+
                               |
                               v
                     +-------------------+
                     |  Agent Reasoning  |
                     +---------+---------+
                               |
                         Need more data?
                           /          \
                         YES           NO
                         |              |
                         v              |
                    +---------+         |
                    |  x402   |         |
                    | payment |         |
                    +----+----+         |
                         |              |
                         v              |
                   Paid service         |
                         |              |
                         +-------+------+
                                 |
                                 v
                        Final recommendation
                                 |
                                 v
                         Evidence + score
                         + spend report
```

Privy sits underneath the wallet/authentication and controlled transaction layer:

```text
                   PRIVY
                     |
           +---------+---------+
           |                   |
       User wallet        Agent wallet
                               |
                               v
                         x402 payments
```

Bazantic can wrap our service/API surfaces:

```text
Scout internal API
       |
       v
Bazantic x402/MPP Gateway
       |
       +--> MCP Server
       |
       +--> Recipe
       |
       v
Other AI agents can discover/use/pay for the service
```

---

# 5. Why The Graph Is the Core / Load-Bearing Integration

This is extremely important for the ETHGlobal strategy.

The Graph prize page explicitly says the AI track wants The Graph to be a **load-bearing** part of the project. The project must use live Graph data and do meaningful work such as reasoning, decisions, automation, or natural-language interaction; simply printing query results is insufficient.

The Graph's Subgraph MCP provides an open-source MCP interface that lets compatible AI clients:

- discover relevant Subgraphs,
- inspect GraphQL schemas,
- run queries,
- and access Subgraph deployments through a standardized interface.

This means Scout can turn:

> “Compare lending activity across Base protocols”

into discovery and live data retrieval instead of us hard-coding one specific protocol or dataset.

### The Graph should therefore be central to our product loop:

```text
Natural-language request
        ↓
Scout identifies blockchain questions
        ↓
Subgraph MCP
        ↓
Discover relevant Subgraphs
        ↓
Inspect schemas
        ↓
Run GraphQL queries
        ↓
Normalize findings
        ↓
Reason over results
```

The Graph is not just “one API we call.”

It is Scout's **on-chain research infrastructure**.

---

# 6. The Graph Track Strategy

## The Graph — Best AI Tooling or AI Use Case with The Graph (From Scratch)

**Current published prize:** $5,000

Breakdown:

- 1st: $2,500
- 2nd: $1,500
- 3rd: $1,000

### Why Scout qualifies conceptually

We are building a net-new AI application.

The application uses:

- The Graph,
- Subgraph MCP,
- live Graph provider data,
- natural-language agent reasoning,
- and potentially x402 pay-per-query flows.

The track specifically describes:

- AI research assistants,
- trading/execution agents,
- portfolio copilots,
- risk monitors,
- natural-language access through Subgraph MCP,
- and autonomous x402 payments.

### Required implementation

Do not fake this with local datasets.

Use:

- Subgraph Studio/API key, or
- another permitted live Graph provider,
- and/or live Subgraph MCP.

### Demo proof we should show

```text
User:
“Analyze lending protocols on Base.”

Scout:
“Finding relevant Subgraphs...”

Subgraph MCP:
“Found relevant deployments.”

Scout:
“Querying TVL/activity/user data...”

Scout:
“Comparing protocols...”

Scout:
“I need deeper analysis.”

x402:
“Payment required: $0.03.”

Privy/agent wallet:
“Approve/sign payment.”

x402:
“Payment settled.”

Scout:
“Additional evidence received.”

Scout:
“Final recommendation: ...”
```

### Source

ETHGlobal ETHOnline 2026 prize page:  
https://ethglobal.com/events/ethonline2026/prizes

The Graph docs:  
https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/

---

# 7. Optional The Graph Composable/Standardized Prize

There is another Graph prize:

## Best Use of Composable or Standardized Graph Products

**Prize pool:** $5,000

This is more demanding.

The published requirements say a submission should either:

- compose two or more Graph products, or
- meaningfully use a standardized schema such as Messari Standardized Subgraphs.

Simply querying one Subgraph is not enough.

### Potential way Scout can target it

We could build a cross-protocol comparison using standardized data.

Example:

```text
Scout request:
“Compare major lending protocols.”

                ↓

Standardized Subgraph schema
                ↓
Protocol A
Protocol B
Protocol C
Protocol D
                ↓
One analysis pattern
                ↓
Cross-protocol comparison
```

Alternatively, combine:

```text
Subgraph
   +
Substreams
```

or build a reusable Substreams pipeline.

### Recommendation

Do not make this mandatory initially.

Build the AI track first.

Then, if time permits, add a second Graph product or standardized-schema composition.

---

# 8. OpenSEO — What It Does

OpenSEO is an open-source alternative to Semrush/Ahrefs.

Its current repository describes workflows including:

- keyword research,
- rank tracking,
- competitor insights,
- backlinks,
- site audits,
- AI visibility.

OpenSEO also exposes an MCP server so AI agents can directly call SEO tools.

The current published OpenSEO MCP tools include:

- keyword research,
- live Google organic SERP inspection,
- domain/page rank data,
- competitor comparison,
- keyword metrics,
- backlink/referring-domain overview,
- Google Search Console performance,
- URL inspection.

The MCP endpoint documented by the repository is:

```text
https://app.openseo.so/mcp
```

OpenSEO Agent Skills provide reusable workflows such as keyword research, competitive landscape, competitor analysis, keyword clustering, and link prospecting.

### Why it fits Scout

The Graph tells us:

> “Users and activity are increasing.”

OpenSEO tells us:

> “People may or may not be searching for this.”

Together Scout can identify:

> “This protocol has real on-chain adoption but surprisingly weak online visibility.”

That gap itself becomes a useful business signal.

---

# 9. Example: The Graph + OpenSEO

Suppose Scout investigates Protocol X.

The Graph returns:

```text
Active users:       +42%
Volume:             +31%
Transactions:       +55%
TVL:                +21%
```

OpenSEO returns:

```text
Search demand:      +8%
Organic presence:   Low
Competitors:        Strong
Content gap:        High
```

Scout can reason:

```text
On-chain adoption is growing
        +
Web demand is growing slowly
        +
Organic visibility is weak
        =
Potential growth / marketing opportunity
```

This is significantly more useful than raw analytics.

---

# 10. x402 — In Very Simple Language

x402 lets an API say:

> “You can use my service, but this request costs $0.03.”

The agent can pay automatically.

Typical flow:

```text
Scout
  |
  | GET /deep-analysis
  v
Service
  |
  | 402 Payment Required
  | “Pay $0.03 USDC”
  v
Scout wallet
  |
  | signs payment
  v
Payment network
  |
  | payment settled
  v
Service
  |
  v
Premium data
```

There is no need for a human to manually click “buy report” every time.

The Graph's published x402 tooling also supports pay-per-query patterns for Subgraph access.

---

# 11. x402 in Scout

We should create at least one paid service.

Example:

```text
GET /api/deep-protocol-analysis
```

Price:

```text
$0.03 USDC
```

The API could return:

```json
{
  "protocol": "Protocol X",
  "wallet_growth": 42.4,
  "retention": 31.2,
  "whale_activity": 19.8,
  "growth_quality": "strong"
}
```

The important part is not the price.

The important part is:

> The agent decides whether this purchase is worth making.

That creates the autonomous-economy story.

---

# 12. Agent Research Budget

We should give every Scout agent a budget.

Example:

```text
Research budget: $0.50 USDC
```

The agent starts with:

```text
$0.50
```

It spends:

```text
Graph query / live data:    $0.00
OpenSEO research:           $0.00 / configured cost
Deep analysis:              $0.03
Competitor intelligence:    $0.05
```

Final:

```text
Total spent:       $0.08
Remaining:         $0.42
```

The agent should be able to explain:

> “I spent $0.03 because the initial blockchain data was insufficient to distinguish two candidates.”

This makes x402 meaningful instead of decorative.

---

# 13. ENSv2 — What It Does in Scout

ENS is more than putting `.eth` next to a wallet address.

The current ETHOnline 2026 ENS bounty is specifically centered on ENSv2.

ENSv2 introduces:

- hierarchical registries,
- Permissioned Resolvers,
- Enhanced Access Control,
- resolver/record controls,
- namespace/subname management.

The prize page explicitly says AI agents can have their own namespace, identity, and permissions.

### Scout use case

Give the agent an identity such as:

```text
scout.<project>.eth
```

or:

```text
research.<project>.eth
```

Then create permissions like:

```text
Scout agent:
✓ Read research configuration
✓ Update research status
✓ Publish analysis record
✓ Spend within budget
✗ Transfer arbitrary user funds
✗ Change critical owner permissions
```

This makes ENS functional rather than cosmetic.

---

# 14. ENS as an Agent Namespace

Conceptually:

```text
project.eth
   |
   +-- scout.project.eth
   |
   +-- analyst.project.eth
   |
   +-- auditor.project.eth
```

Each subname can represent a different agent or function.

For our MVP:

```text
scout.project.eth
```

is the autonomous research agent.

### Possible records

Examples:

```text
Agent type:     research
Service URL:    https://scout.example
MCP URL:        ...
Agent status:   active
Budget limit:   0.50 USDC
```

These exact record structures depend on the ENSv2 implementation we choose, so they should be finalized against the live ENSv2 testnet APIs before implementation.

### ENS bounty requirement

The current published requirement is to build on **ENSv2 on Sepolia**, and ENSv2 features must be central rather than a cosmetic add-on.

---

# 15. Privy — What It Does

Privy provides:

- authentication,
- embedded self-custodial wallets,
- wallet interactions,
- user-facing onchain experiences.

The ETHOnline 2026 page currently lists two Privy prizes:

## Best B2B Financial Product — $2,500

This requires:

- Privy as a core product component,
- at least one Privy wallet,
- a business/organization use case,
- a functional B2B workflow,
- and at least one Privy control such as policies, signers, key quorums, or intents.

## Best Financial Flow — $2,500

This requires:

- Privy as a core part,
- at least one Privy wallet,
- a functional financial flow using a generally available Privy feature.

Eligible examples include:

- transfers,
- bridging,
- stablecoin conversions,
- swaps,
- self-service Earn,
- onramps,
- other supported wallet actions.

---

# 16. Privy Use in Scout

Do not use Privy just for login.

The stronger implementation is:

```text
User
  |
  v
Privy
  |
  v
Create/connect wallet
  |
  v
Fund Scout
  |
  v
Agent research budget
```

Then:

```text
User:
“Give Scout $0.50.”

Privy:
Wallet action

Scout:
Budget = $0.50

Scout:
Pays $0.03 through x402

Scout:
Continues research
```

This gives us a real financial flow.

---

# 17. Better Privy Version — Organization / Team Research Wallet

To target the B2B prize more directly:

Imagine a DAO/startup/team uses Scout.

```text
Company treasury
       |
       v
Privy organization wallet
       |
       +-- $5/day research budget
       |
       +-- approval policy
       |
       +-- team permissions
       |
       v
Scout research agent
```

Rules:

```text
Scout can:
✓ spend up to $0.10 per research request
✓ spend up to $1/day
✓ pay whitelisted research services

Scout cannot:
✗ transfer treasury funds
✗ change policy
✗ withdraw funds
```

That is a stronger B2B story.

---

# 18. Bazantic — What It Actually Does

The current ETHOnline page describes Bazantic as a layer that simplifies AI development by allowing API providers to turn their APIs into services agents can understand, use, and pay for.

The published capabilities include:

- deploy an x402/MPP Gateway,
- deploy an MCP Server,
- create custom domains,
- create reusable tool calls called Recipes,
- provide instructions about when/why/how a service should be used.

This makes Bazantic a natural companion to our agent architecture.

---

# 19. Bazantic in Scout

We can expose one of our own backend services.

Example:

```text
Scout Research API
GET /api/protocol-opportunity
```

Then expose it through Bazantic.

The result can be:

```text
Bazantic
   |
   +-- MCP tool
   |
   +-- x402/MPP gateway
   |
   +-- Recipe
```

Another agent could ask:

> “Find the strongest opportunity among these protocols.”

It can discover Scout's service, understand when it should be used, call it, and pay for it.

This takes Scout from:

> “an AI app”

to:

> “an agent-compatible research service.”

---

# 20. Bazantic Recipe Example

A Recipe could teach an agent:

```text
Name:
Protocol Opportunity Analysis

Use this service when:
- You have a blockchain protocol or contract
- You want to compare on-chain adoption with online demand
- You need a scored opportunity assessment

Input:
- protocol/address
- target chain
- optional market category

Output:
- on-chain growth
- search demand
- competitive pressure
- opportunity score
- recommended action

Cost:
$0.03 USDC
```

Then an agent can repeat the same process without a human explaining it.

---

# 21. Bazantic Prize Paths

Current published Bazantic prize tracks include:

## Help an Agent Use Your Hackathon Project — $1,000

Important:
- currently marked **Continuity Track only**.
- requires Bazantic MCP + Recipe.
- requires testing the same task with/without the Recipe and showing meaningful improvement.

That means this prize may **not be available to us** if we are strictly entering the Net-new/Start Fresh pool.

## Best Recipe that uses ETHGlobal Sponsor APIs — $1,000

This is potentially more relevant.

Requirements currently include:

- create a Bazantic account,
- create an x402/MPP Gateway,
- use at least one other service already available through Bazantic OR available from an ETHGlobal sponsor,
- create a Recipe using both,
- make the final result depend meaningfully on both,
- demonstrate the workflow.

This can fit our project well.

Potential workflow:

```text
The Graph
   ↓
on-chain candidate
   ↓
OpenSEO
   ↓
web/market intelligence
   ↓
Scout API / Bazantic Recipe
   ↓
final opportunity report
```

---

# 22. Hedera — Very Interesting Backup / Replacement

ETHOnline 2026 currently lists a Hedera prize:

## AI & Agentic Payments on Hedera — $6,000

The published challenge is unusually aligned with what we are already doing.

Hedera asks teams to:

- stand up a real x402-gated service on Hedera,
- build the platform that consumes it,
- let an agent discover the service,
- let the agent pay for it,
- avoid API keys/subscriptions in the demo.

Examples from the published bounty include:

- pay-per-call inference,
- metered data feeds,
- agent marketplaces,
- micropayment streaming.

### Possible adaptation

Instead of only using x402 on our normal network:

```text
Hedera
   |
   +-- x402 service
   |
   +-- Scout agent
   |
   +-- paid research request
```

Then Scout could pay a Hedera-hosted data/inference service.

This is one of the strongest backup tracks because it does not require us to invent a totally different product.

---

# 23. Arc — Another Strong Backup

ETHOnline 2026 has a large Arc prize pool.

One Arc direction is:

## Build autonomous agents that transact on Arc.

The published description asks for agents that:

- hold wallets,
- make payments,
- manage risk,
- settle jobs,
- or transact with other agents using USDC.

It looks for:

- clear decision logic tied to real signals,
- autonomous spending/payments/settlement,
- Agent Stack,
- wallet integrations,
- agent-to-agent or service payments.

This maps extremely well to Scout.

### Potential adaptation

```text
Scout sees:
High-value opportunity

        ↓

Needs paid analysis

        ↓

Agent decides:
“This is worth $0.03.”

        ↓

USDC payment on Arc

        ↓

Research service executes

        ↓

Result returns
```

Arc becomes the stablecoin settlement layer.

---

# 24. Why Hedera/Arc Are Good Fallbacks

They both fit the existing story:

```text
Graph = information
OpenSEO = information
Agent = decision
x402 = payment logic
Hedera/Arc = payment settlement network
```

That means they do not require rebuilding the product from scratch.

They are **replaceable infrastructure modules**.

---

# 25. Why We Should NOT Try to Integrate Every Partner

ETHGlobal allows up to three partner prize submissions.

The goal is not:

> “Use everything.”

The goal is:

> “Build one excellent product that legitimately satisfies the strongest three bounties.”

We can integrate more technologies internally, but choose three final submissions.

---

# 26. Recommended Partner Strategy

## Non-negotiable core

### 1. The Graph

This is the core because:

- it is central to the product,
- it has a large bounty,
- its AI track explicitly matches our agent architecture,
- Subgraph MCP + x402 is highly aligned with the concept.

### 2. x402

Not necessarily a separate sponsor prize target by itself, but it is a major product primitive and explicitly mentioned in the Graph AI track.

### 3. OpenSEO

This is the differentiated data layer that makes our agent more useful than a generic blockchain assistant.

---

# 27. Strong Primary Bounty Candidates

## Candidate A: The Graph
Very strong.

Use:
- Subgraph MCP
- live Subgraph data
- AI reasoning
- x402 pay-per-query
- optionally standardized schema

## Candidate B: ENSv2
Very strong.

Use:
- ENSv2 Sepolia
- agent namespace
- agent identity
- delegated permissions
- Permissioned Resolver / Enhanced Access Control

## Candidate C: Privy
Strong.

Use:
- embedded wallet
- funding flow
- controlled agent budget
- policy / signer / intent depending on the final implementation

---

# 28. Backup Candidates

## Hedera

Very strong alternative if the x402-on-Hedera flow is easy to demonstrate.

## Arc

Very strong alternative if Arc + USDC agentic payment setup is easier than expected.

## Bazantic

Potentially strong for:

- MCP service exposure,
- x402/MPP gateway,
- reusable Recipe,
- sponsor API recipe.

But the specific Bazantic prize we target should be chosen after checking the final current rules and whether the prize is available to the Start Fresh pool.

---

# 29. Partner Selection Matrix

| Partner | Role in Scout | Product importance | Bounty fit | Keep? |
|---|---|---:|---:|---|
| The Graph | Live on-chain intelligence | 10/10 | 10/10 | YES |
| x402 | Autonomous payments | 10/10 | 10/10 for Graph/Hedera/Bazantic/Arc | YES |
| OpenSEO | Web/search intelligence | 9/10 | 8/10 as supporting tech | YES |
| ENSv2 | Agent identity + permissions | 8/10 | 9/10 | YES |
| Privy | Wallet + financial flow | 8/10 | 9/10 | YES |
| Bazantic | Agent service/MCP/Recipe layer | 7/10 | 8/10, prize-dependent | OPTIONAL |
| Hedera | x402 payment rail | 7/10 | 10/10 | BACKUP |
| Arc | USDC agent payment rail | 7/10 | 10/10 | BACKUP |
| 1inch | DeFi execution/liquidity | 5/10 | 5/10 | LOW |
| Uniswap | Swap/DeFi integration | 5/10 | 5/10 | LOW |
| Ledger | Hardware-secured agent | 6/10 | 8/10 if hardware available | OPTIONAL |
| Chainlink | Data/TEE/onchain workflows | 4/10 | 5/10 | LOW |
| World | human-backed agents / identity | 4/10 | 6/10 | OPTIONAL |

---

# 30. Final Recommended Architecture

```text
                                  USER
                                   |
                                   v
                         +-------------------+
                         |       PRIVY       |
                         | Auth + Wallet     |
                         +---------+---------+
                                   |
                                   v
                         +-------------------+
                         |      ENSv2        |
                         | Agent Identity    |
                         | Namespace        |
                         | Permissions      |
                         +---------+---------+
                                   |
                                   v
                         +-------------------+
                         |    SCOUT AGENT    |
                         | Planner/Reasoner  |
                         +---------+---------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
              v                    v                    v
       +-------------+      +-------------+      +-------------+
       | The Graph   |      |  OpenSEO    |      | Bazantic    |
       | Subgraph    |      | MCP         |      | Agent svc   |
       | MCP         |      | Web/SEO     |      | Recipe/MCP  |
       +------+------+      +------+------+      +------+------+
              |                    |                    |
              +--------------------+--------------------+
                                   |
                                   v
                           Agent decision logic
                                   |
                          “Need more evidence?”
                              /          \
                            YES           NO
                             |             |
                             v             |
                         +--------+        |
                         | x402   |        |
                         | payment|        |
                         +---+----+        |
                             |             |
                             v             |
                      paid data/service    |
                             |             |
                             +------+------+
                                    |
                                    v
                             FINAL REPORT
                                    |
                       +------------+------------+
                       |                         |
                       v                         v
                  Recommendation            Spend log
                  Confidence score          Evidence trail
```

---

# 31. Detailed End-to-End Example

## User request

> “Analyze the top lending protocols on Base. Tell me which one has the best opportunity for a new developer product. I have a $0.50 research budget.”

### Step 1 — User authenticates

Privy handles login/wallet.

```text
User -> Privy -> wallet
```

### Step 2 — Scout identifies itself

ENSv2 provides:

```text
scout.<project>.eth
```

Scout has an explicit budget policy.

```text
Max per call: $0.10
Total budget: $0.50
```

### Step 3 — Scout plans

The agent determines:

```text
Need:
1. on-chain protocol activity
2. user growth
3. liquidity/activity data
4. web/search demand
5. competitor landscape
```

### Step 4 — Scout uses The Graph

Scout uses Subgraph MCP.

It:

```text
discovers relevant Subgraphs
      ↓
inspects schemas
      ↓
queries live data
      ↓
normalizes results
```

Possible result:

```text
Protocol A +48%
Protocol B +31%
Protocol C +73%
```

### Step 5 — Scout narrows candidates

Instead of researching everything deeply:

```text
100 protocols
   ↓
10 candidates
   ↓
3 candidates
```

This is important because the agent is using reasoning to control cost and compute.

### Step 6 — Scout uses OpenSEO

For the three candidates:

```text
keyword demand
SERPs
competitors
backlinks
content gaps
```

Result:

```text
Protocol C:
On-chain growth = excellent
Web visibility = weak
Search competition = moderate
```

### Step 7 — Scout needs deeper evidence

It decides:

> “Protocol C and Protocol A are close. I need deep wallet-flow analysis.”

It calls a paid API.

### Step 8 — x402 response

The API says:

```text
402 Payment Required
Price: $0.03 USDC
```

### Step 9 — Agent pays

Privy/agent wallet:

```text
Approve x402 payment
```

The payment is settled.

### Step 10 — Paid result returns

Scout gets:

```text
retention
wallet concentration
whale share
new wallet growth
```

### Step 11 — Agent reasons

It combines:

```text
The Graph
+
OpenSEO
+
paid analysis
```

### Step 12 — Final answer

```text
Best opportunity: Protocol C

Score: 88/100

Why:
- Strongest user growth
- Increasing transaction activity
- Low relative online visibility
- Large content/search gap
- Strong developer ecosystem signal

Recommendation:
Build developer analytics tooling around Protocol C.

Research cost:
$0.08 USDC

Remaining budget:
$0.42 USDC
```

---

# 32. The “Wow” Moment in the Demo

The strongest screen is the payment.

Show:

```text
Scout is researching...

The Graph:
✓ On-chain activity analyzed

OpenSEO:
✓ Search demand analyzed

Scout:
“I need deeper evidence.”

------------------------------------------------

Paid Research Service

Cost: $0.03 USDC

Reason:
“Resolve uncertainty between
Protocol A and Protocol C.”

                     [PAY]

------------------------------------------------

Agent Wallet

scout.<project>.eth
Balance: $0.47

        - $0.03

Payment settled ✓

------------------------------------------------

Scout:
“Additional evidence received.”
```

Then immediately show the improved result.

This makes the autonomous payment easy for judges to understand.

---

# 33. The “Agent Identity” Wow Moment

Show:

```text
Agent Identity

scout.<project>.eth

Role:
Protocol Research Agent

Permissions:
✓ research
✓ publish reports
✓ spend up to $0.10/request
✓ total $0.50/day

Blocked:
✗ arbitrary transfers
✗ policy changes
✗ user wallet control
```

This gives ENSv2 a reason to exist.

---

# 34. The “Agent Wallet” Wow Moment

Show:

```text
Scout Treasury

$0.50 USDC

Research budget
------------------------
Used      $0.08
Remaining $0.42
```

This gives Privy a real role.

---

# 35. The “Bazantic” Wow Moment

Expose the research API through Bazantic.

Another agent can say:

> “Use Scout's protocol opportunity service.”

Bazantic provides:

```text
MCP tool
+
Recipe
+
payment gateway
```

Now Scout's capabilities are reusable by other agents.

---

# 36. Suggested Internal Code Structure

```text
/apps
  /web
  /api
  /agent

/packages
  /graph
  /openseo
  /x402
  /ens
  /privy
  /bazantic
  /scoring
  /schemas
  /agent-runtime

/services
  /deep-analysis
  /competitor-analysis
  /opportunity-analysis
```

---

# 37. Adapter-Based Architecture

Make each partner an adapter.

```ts
interface DataProvider {
  name: string;
  capabilities: string[];
  execute(input: unknown): Promise<unknown>;
}
```

Implement:

```text
GraphProvider
OpenSEOProvider
BazanticProvider
```

Wallet:

```ts
interface WalletProvider {
  getBalance(): Promise<number>;
  signPayment(payment: unknown): Promise<unknown>;
}
```

Implement:

```text
PrivyWallet
```

Identity:

```ts
interface AgentIdentity {
  resolveName(): Promise<string>;
  getPermissions(): Promise<unknown>;
}
```

Implement:

```text
ENSIdentity
```

Payment:

```ts
interface PaymentProvider {
  pay(request: PaymentRequest): Promise<PaymentResult>;
}
```

Implement:

```text
X402Payment
```

This is what makes replacement possible.

---

# 38. Why Adapter Architecture Matters for Hackathon Strategy

At the end of the event, we can evaluate:

```text
The Graph
ENS
Privy
Bazantic
Hedera
Arc
```

Then select the three strongest partner submissions.

The core app remains the same.

Only adapters and the demo path change.

This prevents us from having to rewrite Scout if a partner bounty proves difficult.

---

# 39. Suggested Build Order

## Phase 1 — Product skeleton

Build:

```text
User prompt
   ↓
Scout agent
   ↓
final response
```

No partner complexity yet.

Goal:
Prove the agent loop.

---

## Phase 2 — The Graph

Add:

```text
Subgraph MCP
live Graph data
```

Goal:
Make The Graph the core source of blockchain intelligence.

---

## Phase 3 — OpenSEO

Add:

```text
OpenSEO MCP
keyword research
SERP
competitor analysis
```

Goal:
Give Scout a second independent evidence source.

---

## Phase 4 — x402

Add:

```text
paid research endpoint
402
payment
retry
result
```

Goal:
Demonstrate autonomous spending.

---

## Phase 5 — Privy

Add:

```text
embedded wallet
funding
agent balance
payment signing
```

Goal:
Make the payment flow user-friendly.

---

## Phase 6 — ENSv2

Add:

```text
agent subname
permissions
delegated rights
```

Goal:
Make the agent a real onchain identity.

---

## Phase 7 — Bazantic

Add:

```text
Bazantic gateway
MCP
Recipe
```

Goal:
Turn Scout's service into an agent-readable/payable service.

---

## Phase 8 — Optional partner replacement

Evaluate:

```text
Hedera
Arc
Ledger
World
etc.
```

Only integrate if a strong bounty fit can be achieved without damaging the core demo.

---

# 40. What NOT to Build

Avoid:

### 1. A giant analytics dashboard

It weakens the agent story.

### 2. Ten unrelated integrations

Judges may feel that the integrations are bolted on.

### 3. Hard-coded Graph queries

Prefer Subgraph MCP / flexible discovery where possible.

### 4. Fake x402

The payment should actually happen.

### 5. ENS only as a profile picture/name

ENSv2 must be central to target its bounty.

### 6. Privy only as login

Use an actual wallet/financial flow.

### 7. OpenSEO only as a static report

Make the agent reason over it.

### 8. Overbuilding

A polished single research workflow is better than five unfinished ones.

---

# 41. 3–4 Minute Demo Plan

## 0:00–0:20 — Problem

Show:

> “Crypto protocols can have strong on-chain adoption but weak web presence, and agents need to buy information without human intervention.”

## 0:20–0:40 — User request

Enter:

> “Find the most promising lending protocol on Base for a new developer product.”

## 0:40–1:20 — The Graph

Show:

```text
Finding Subgraphs...
Querying live data...
Analyzing users/volume/activity...
```

## 1:20–1:50 — OpenSEO

Show:

```text
Search demand
SERP
competitors
content gap
```

## 1:50–2:15 — x402

Show:

```text
Need deeper evidence.

402 Payment Required
$0.03 USDC

Agent pays
Payment settled
```

## 2:15–2:35 — ENS + Privy

Show:

```text
scout.<project>.eth
Agent budget
Permission policy
Wallet balance
```

## 2:35–3:10 — Final reasoning

Show:

```text
Protocol C

Opportunity: 88/100

Why:
...
```

## 3:10–3:30 — Optional Bazantic

Show:

```text
Scout research service
MCP + Recipe
Agent can discover/use/pay
```

---

# 42. Judge-Facing One-Liner

> **Scout is an autonomous Web3 research agent that combines live blockchain intelligence from The Graph with web intelligence from OpenSEO, autonomously purchases additional evidence through x402, and operates with its own ENSv2 identity and controlled Privy wallet.**

---

# 43. Judge-Facing Explanation of Each Technology

## The Graph

> The agent's source of truth for live on-chain intelligence.

## OpenSEO

> The agent's source of truth for online/search/competitive intelligence.

## x402

> The agent's machine-native payment rail for buying additional information.

## ENSv2

> The agent's onchain identity, namespace, and permission system.

## Privy

> The wallet/authentication infrastructure that lets users fund and control the agent.

## Bazantic

> The agent service layer that exposes research capabilities as MCP/payable tools and reusable Recipes.

---

# 44. Recommended Final Three

## Current strongest choice

### #1 The Graph
Core / mandatory.

### #2 ENSv2
Very strong because the product has a genuine agent identity + permissions story.

### #3 Privy
Very strong because there is a genuine wallet + financial flow.

---

# 45. Strongest Replacement Plan

If one of those is weak during implementation:

### Replace Privy with Hedera

Reason:

The x402 service + autonomous payment architecture already maps directly to Hedera's published AI & Agentic Payments bounty.

### Replace Privy or ENS with Arc

Reason:

Arc explicitly targets autonomous agents making USDC payments and managing transactions.

### Replace ENS/Privy with Bazantic

Reason:

If the Bazantic Recipe + MCP workflow becomes exceptionally good and its bounty remains available to our submission pool, it may become a stronger third submission than a shallow ENS/Privy implementation.

---

# 46. What I Would Prioritize

Priority order:

```text
1. The Graph
2. x402
3. OpenSEO
4. ENSv2
5. Privy
6. Bazantic
7. Hedera backup
8. Arc backup
```

But this is an implementation priority, not necessarily the final bounty ranking.

---

# 47. Technical MVP Requirements

## Mandatory MVP

- Frontend
- backend
- AI agent
- live Graph data
- Subgraph MCP
- OpenSEO MCP
- x402 payment
- agent wallet
- final recommendation
- spend tracking
- evidence trail

## Strong enhancement

- ENSv2 agent namespace
- ENSv2 permissions
- Privy controls
- Bazantic Recipe
- standardized Graph schema
- second Graph product / Substreams

---

# 48. Data Model

Potential internal record:

```json
{
  "research_id": "uuid",
  "agent": {
    "ens_name": "scout.project.eth",
    "wallet": "0x..."
  },
  "request": "Analyze lending protocols on Base",
  "budget": {
    "initial": 0.5,
    "spent": 0.08,
    "remaining": 0.42,
    "currency": "USDC"
  },
  "sources": [
    {
      "name": "The Graph",
      "type": "onchain",
      "cost": 0
    },
    {
      "name": "OpenSEO",
      "type": "web",
      "cost": 0
    },
    {
      "name": "Deep Analysis",
      "type": "paid",
      "cost": 0.03,
      "payment": "x402"
    }
  ],
  "candidates": [],
  "recommendation": {},
  "confidence": 0.89
}
```

---

# 49. Opportunity Score

A simple initial scoring system:

```text
Onchain Growth            30%
User Growth               20%
Market/Search Demand      20%
Competitive Gap           15%
Web/SEO Opportunity        10%
Evidence Confidence         5%
```

Example:

```text
Onchain growth:      93
User growth:         89
Search demand:       76
Competitive gap:     91
SEO opportunity:     95
Confidence:          87

Final score:         88
```

Do not pretend the score is mathematically objective.

Present it as:

> “Scout's research score based on the configured evidence model.”

---

# 50. Research Cost Optimization

The agent should not blindly buy everything.

Decision policy:

```text
Start with free/low-cost evidence
        ↓
Estimate uncertainty
        ↓
Is additional information likely to change the decision?
       / \
     YES  NO
      |    |
      v    v
Buy data  stop
      |
      v
Recalculate
```

This makes autonomous spending intelligent.

---

# 51. Example Agent Decision Log

```text
[10:01:02]
Task received.

[10:01:04]
Identified 4 required evidence categories.

[10:01:06]
Graph Subgraph discovery started.

[10:01:10]
Found 8 relevant deployments.

[10:01:15]
Live blockchain analysis complete.

[10:01:17]
Shortlisted 3 candidates.

[10:01:19]
OpenSEO keyword analysis started.

[10:01:25]
Candidate A and C remain close.

[10:01:27]
Deep wallet analysis required.

[10:01:28]
Service price = $0.03.

[10:01:29]
Budget check: $0.50 available.

[10:01:30]
x402 payment signed.

[10:01:31]
Payment settled.

[10:01:34]
Deep analysis received.

[10:01:38]
Final recommendation generated.
```

This log is excellent for a hackathon UI.

---

# 52. Security / Permission Model

Never give the research agent unrestricted funds.

Use:

```text
Agent budget
$0.50 total

Per-request cap
$0.10

Allowed:
- research services
- whitelisted recipient/services

Disallowed:
- arbitrary transfers
- swaps without approval
- changing permissions
```

ENSv2 can represent delegated permissions.

Privy can provide wallet controls/policies where supported.

x402 is only for the payment operation.

This creates a much safer agentic system.

---

# 53. Replaceability Principle

Each partner should solve a replaceable problem.

```text
Blockchain intelligence
      |
      +-- The Graph

Web intelligence
      |
      +-- OpenSEO

Identity
      |
      +-- ENSv2

Wallet
      |
      +-- Privy

Payment
      |
      +-- x402

Agent-service gateway
      |
      +-- Bazantic

Payment settlement fallback
      |
      +-- Hedera / Arc
```

The product remains:

> Scout

even if one partner changes.

---

# 54. Submission Documentation Structure

Repository:

```text
README.md
ARCHITECTURE.md
DEMO.md
SECURITY.md
PARTNERS.md
BOUNTIES.md

/apps/web
/apps/api
/apps/agent

/packages/graph
/packages/openseo
/packages/x402
/packages/ens
/packages/privy
/packages/bazantic
```

---

# 55. README Partner Section

Example:

```text
## Partner Integrations

### The Graph
Used for live on-chain protocol discovery and analysis through Subgraph MCP.

### OpenSEO
Used for live search and competitive intelligence.

### x402
Used to let the agent autonomously purchase deeper research.

### ENSv2
Used for agent identity, namespace and delegated permissions.

### Privy
Used for wallet creation, funding and controlled payment flows.

### Bazantic
Used to expose Scout's research service as a reusable agent-readable MCP/Recipe.
```

---

# 56. Demo Evidence We Should Capture

## The Graph

Capture:

- Subgraph discovery,
- live query,
- actual returned values.

## OpenSEO

Capture:

- keyword research,
- SERP/competition,
- actual output used in reasoning.

## x402

Capture:

- 402 response,
- payment,
- settled result.

## ENSv2

Capture:

- ENSv2 Sepolia transaction/configuration,
- name/namespace,
- permissioned behavior.

## Privy

Capture:

- wallet,
- funding/action,
- transaction.

## Bazantic

Capture:

- gateway,
- MCP tool,
- Recipe,
- agent invocation.

---

# 57. What Counts as “Meaningful Use”

This is important for judging.

Bad:

```text
We queried The Graph.
```

Good:

```text
Scout queried live Graph data and used the result to
eliminate 7 candidates and select 3 for deeper research.
```

Bad:

```text
We used OpenSEO.
```

Good:

```text
Scout compared search demand and competitor strength
against on-chain growth to identify an under-marketed protocol.
```

Bad:

```text
We integrated x402.
```

Good:

```text
Scout independently decided that additional evidence
was worth $0.03 and paid for it from its research budget.
```

Bad:

```text
We used ENS.
```

Good:

```text
Scout operates under its own ENSv2 subname and delegated
permissions that restrict what the agent can change and spend.
```

Bad:

```text
We used Privy.
```

Good:

```text
A user funds the agent through a Privy wallet and the
agent uses that wallet for controlled autonomous purchases.
```

---

# 58. What Makes the Product Interesting Outside the Hackathon

The longer-term product is not just:

> “crypto analyst”

It could become:

> **Agent infrastructure for paid Web3 research.**

Potential future agents:

```text
Scout Research Agent
Risk Agent
Portfolio Agent
Developer Relations Agent
Growth Agent
Treasury Agent
DAO Analyst
Protocol Monitor
```

They can all share the same model:

```text
discover information
      ↓
evaluate evidence
      ↓
buy missing information
      ↓
make decision
      ↓
execute safe action
```

---

# 59. Future Product Marketplace

Eventually:

```text
                  AGENT MARKETPLACE

┌───────────────────────────────────────────────┐
│ Protocol Analysis           $0.03             │
│ Risk Analysis               $0.05             │
│ SEO Intelligence            $0.02             │
│ Wallet Flow Analysis        $0.03             │
│ Contract Audit              $0.10             │
│ Market Report               $0.05             │
└───────────────────────────────────────────────┘
```

Agents can discover these services and pay per call.

Bazantic/x402 can help make those services agent-compatible and payable.

---

# 60. Long-Term Product Vision

The final vision can be described as:

> **A machine-to-machine research economy where agents discover information, pay for information, reason over it, and act within explicit identity and spending permissions.**

The hackathon MVP is simply:

> **Scout — the first autonomous protocol intelligence agent.**

---

# 61. ETHOnline Partner Status as of September 5, 2026

The current ETHGlobal ETHOnline page lists 11 prize sponsors:

- The Graph — $15,000
- Hedera — $15,000
- Arc — $10,000
- World — $7,000
- 1inch — $7,000
- ENS — $5,000
- Uniswap Foundation — $5,000
- Ledger — $5,000
- Privy — $5,000
- Chainlink — $3,000
- Bazantic — $3,000

Source:  
https://ethglobal.com/events/ethonline2026/prizes

---

# 62. Relevant Current Prize Details

## The Graph

Two particularly relevant prizes:

### Best Use of Composable or Standardized Graph Products
$5,000

Requires either:

- two or more Graph products composed, OR
- meaningful use of standardized schema.

Live Graph data required.

### Best AI Tooling or AI Use Case with The Graph — From Scratch
$5,000

Requires:

- Graph as load-bearing,
- live Graph data,
- meaningful AI reasoning/decisions/interface,
- public repo,
- clear README/SKILL,
- demo video 2–4 minutes.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

---

# 63. Relevant Hedera Prize

### AI & Agentic Payments on Hedera — $6,000

Hedera specifically asks for:

- real x402-gated service,
- agent discovery,
- agent payment,
- no API key/subscription in the demonstrated flow.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

This is a very strong fallback because our x402 architecture is already designed around this pattern.

---

# 64. Relevant Arc Prize

Arc's current page includes:

### Autonomous agents that transact on Arc

Looking for:

- agents with clear decision logic,
- autonomous spending,
- payments/settlement,
- wallets and USDC,
- agent-to-agent/service payments.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

This also maps closely to Scout.

---

# 65. Relevant ENS Prize

### Best Use of ENSv2 — $4,500

Current published requirements:

- ENSv2 on Sepolia,
- ENSv2 features central,
- functional demo,
- open-source code.

The page explicitly suggests AI-agent namespaces, identity and permissions.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

---

# 66. Relevant Privy Prizes

Two published directions:

### Best B2B financial product — $2,500

Use:

- Privy wallet,
- B2B workflow,
- policies/signers/quorums/intents,
- business/organization use case.

### Best financial flow — $2,500

Use:

- Privy wallet,
- functional financial action,
- funding/moving/trading/growing/spending assets.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

---

# 67. Relevant Bazantic Prizes

### Help an Agent Use Your Hackathon Project — $1,000

Currently marked Continuity-only.

Requires:

- Bazantic MCP,
- Recipe,
- controlled before/after comparison,
- measurable improvement.

### Best Recipe using ETHGlobal Sponsor APIs — $1,000

Requires:

- Bazantic account,
- x402/MPP Gateway,
- another Bazantic/sponsor service,
- working Recipe,
- meaningful dependency on both.

Source:  
https://ethglobal.com/events/ethonline2026/prizes

---

# 68. Sources

## ETHGlobal

ETHOnline 2026 Prizes:  
https://ethglobal.com/events/ethonline2026/prizes

## The Graph

Subgraph MCP:  
https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/

## OpenSEO

Repository:  
https://github.com/every-app/open-seo

OpenSEO MCP:  
https://github.com/every-app/open-seo/blob/main/web/content/docs/mcp.md

OpenSEO Keyword Research Skill:  
https://github.com/every-app/open-seo/blob/main/web/content/docs/skills/keyword-research.mdx

OpenSEO Competitive Landscape Skill:  
https://github.com/every-app/open-seo/blob/main/.agents/skills/competitive-landscape/SKILL.md

## ENS

ENSv2 overview:  
https://docs.ens.domains/ensv2/overview

ENSv2 Permissioned Registry:  
https://docs.ens.domains/ensv2/permissioned-registry

ENSv2 Permissioned Resolver:  
https://docs.ens.domains/ensv2/permissioned-resolver

ENSv2 Enhanced Access Control:  
https://docs.ens.domains/ensv2/enhanced-access-control

## Privy

https://docs.privy.io/

## Bazantic

https://bazantic.com/

## ETHGlobal

https://ethglobal.com/events/ethonline2026/prizes

---

# 69. Final Recommendation

Build Scout as:

```text
CORE
The Graph + Subgraph MCP
        +
AI Agent
        +
x402
        +
OpenSEO
```

Then layer:

```text
ENSv2
Privy
Bazantic
```

as replaceable partner adapters.

The strongest final submission is currently expected to be:

```text
The Graph
+
ENSv2
+
Privy
```

with:

```text
x402 = payment mechanism
OpenSEO = web intelligence engine
Bazantic = optional service/Recipe layer
Hedera/Arc = fallback partner tracks
```

The core product should never depend on the bounty strategy.

The bounty strategy should sit on top of the product.

That way, if a partner integration becomes too difficult, its adapter can be removed or replaced without changing Scout's main workflow.

---

# 70. The One-Sentence Mental Model

Remember this:

> **The Graph tells Scout what is happening on-chain; OpenSEO tells Scout what is happening on the web; the AI decides what matters; x402 lets Scout buy more information; ENSv2 gives Scout an identity and permissions; Privy gives Scout a wallet; Bazantic makes Scout's own services usable and payable by other agents.**
