# ETHOnline 2026 Bounty Decision Matrix

## Submission decision

Scout should submit for these prizes, in this order:

1. **The Graph — Best AI Tooling or AI Use Case with The Graph (From Scratch), $5,000**
2. **The Graph — Best Use of Composable or Standardized Graph Products, $5,000**
3. **Privy — Best financial flow, $2,500**

The project is technically qualified for these three prizes. None is administratively complete until the required ETHGlobal submission and demo recording are published.

The first commit is dated September 5, 2026, after ETHOnline began on September 4, so the repository belongs in the **Start Fresh** pool. Do not select Continuity prizes.

## Readiness matrix

| Prize | Verdict | Evidence already complete | Missing qualification or proof |
|---|---|---|---|
| The Graph — AI Tooling / AI Use Case, $5,000 | **Technical qualification met** | The Graph is load-bearing; live Gateway data drives 16-asset ranking, scoring, an uncertainty decision and natural-language output. Scout exposes a real Streamable HTTP MCP tool and `SKILL.md`. The repository is public. | Record and submit the required 2–4 minute video. A public API/MCP deployment is strongly recommended for judge reproducibility. |
| The Graph — Composable / Standardized Products, $5,000 | **Technical qualification met** | One Messari Lending/CDP query template runs across four standardized protocol deployments. The live run labels standardized and native adapters separately and explains the leverage of the shared schema. | Record and submit the required 2–4 minute video. Put the four deployment IDs and one shared query in the README proof section. |
| Privy — Best financial flow, $2,500 | **Technical qualification met; proof UI incomplete** | A real Privy server wallet, attached signing policy and SDK signer completed a $0.03 Base Sepolia USDC x402 payment. The paid request returned real deep-analysis data and the onchain transfer settled. | Display wallet, policy ID, amount, payee, settlement hash and explorer link in the final report UI. Record the working flow and explain how Privy removes seed/key handling. |
| Privy — Best B2B financial product, $2,500 | **Partial / weak fit** | Wallet administration, a spending policy and an agent-to-service payment exist. | The product does not yet demonstrate a clear business or organization workflow such as a shared treasury, roles, approvals or quorum. Do not prioritize this over Best financial flow. |
| Bazantic — Best Recipe using sponsor APIs, $1,000 | **Partial** | Scout exposes OpenAPI, Streamable HTTP MCP and a truthful local recipe manifest that combines Graph and Scout analysis. | Create the Bazantic account and public x402/MPP Gateway, publish the two-service recipe, run the required comparison, record it and provide the account username. Local metadata does not qualify. |
| ENS — Best Use of ENSv2, $4,500 | **Partial / not eligible today** | The repository has real viem read/write code and fails closed rather than creating fake receipts. | Provision an ENSv2 Sepolia name and Permissioned Resolver, grant EAC roles, produce successful and unauthorized-revert transactions, and make ENS-resolved configuration central to runtime behavior. The current `/agent/identity` endpoint returns `503 UNCONFIGURED`. |
| Uniswap Foundation — Stack Contribution | **Not eligible** | A Uniswap v3 swap was used operationally to fund the test wallet. | The swap is not a feature in the repository. There is no Uniswap product integration, `FEEDBACK.md`, or submitted feedback form. |
| Hedera — AI & Agentic Payments | **Not eligible** | The adapter fails closed and accurately states that Hedera settlement is unavailable. | A live Hedera x402 service through Blocky402 and a real Hedera paid request are mandatory. The verified Base Sepolia payment does not count. |
| Arc, World, 1inch, Ledger, Chainlink | **Not eligible** | None. | Each requires its named stack; Scout does not integrate those products. |

## Verified live evidence

- Public repository: <https://github.com/8dazo/scout/tree/dev>
- Qualification implementation: commit [`3d74c61`](https://github.com/8dazo/scout/commit/3d74c61c3fe0163d549b0088632089e9ba70658c)
- Privy payer: `0x38B28037192d6b44B537c2c6F717f150a1989E69`
- Privy policy: `eebmveuo1rtadd1pua6vll2x`
- Wallet funding swap: [0x7c771b…beff1](https://sepolia.basescan.org/tx/0x7c771bbf6b70ea8b2e3ef229344f924b3bd7ac869462c09f68ef2ccfaf3beff1)
- x402 payment: [0xb66194…df537](https://sepolia.basescan.org/tx/0xb66194b37432059c1fba839d66e924281ed5984a5580c6ca2d9ad342a11df537)
- Paid run: 16 candidates, 20 initial sources, $0.03 USDC spent, cbBTC on Aave V3 selected with a 53.7 opportunity score and 30 risk score.
- Clean install, configured tests, TypeScript packages and the production Next.js build pass. The root lint command currently has no lint tasks and should not be presented as lint coverage.

## Submission-critical work

1. Deploy the web app and API/MCP endpoint with the working test configuration.
2. Persist the x402 settlement proof in the research session and show its explorer link in the report and payment panel.
3. Add a README `Proof` section containing the Graph deployment IDs, shared Messari query, public endpoints, Privy wallet/policy and the x402 receipt.
4. Record one 2–4 minute video: prompt → four standardized Graph deployments → 16-asset ranking → uncertainty gate → Privy approval → onchain payment → paid result.
5. Submit to both Graph prizes and Privy Best financial flow.
6. Complete Bazantic only after the three primary submissions are ready. Attempt ENS only if the name, resolver and EAC deployment can be completed with enough time to make it central rather than decorative.

## Winner benchmarks

- [deeptrace](https://ethglobal.com/showcase/deeptrace-7fqoz), a previous The Graph prize winner, used standardized Messari data across Aave, Seamless and Moonwell, a read-only MCP server, `SKILL.md`, explicit partial failures and a deployed endpoint. Scout now matches the standardized/MCP pattern and adds live scoring plus paid uncertainty resolution; deployment and judge-facing proof are the remaining differences.
- [PlanBound](https://ethglobal.com/showcase/planbound-wqxy5) displayed live 402 prices, bounded spending and independently verifiable settlement. Scout should copy its evidence presentation by putting the wallet, policy, amount, payee and receipt together.
- [Namesake](https://ethglobal.com/showcase/namesake-kq1ez) made ENS provisioning central through a real subname, records and an agent wallet. It shows why Scout's current unconfigured ENS code is not yet enough.
- [Glassbox402](https://ethglobal.com/showcase/glassbox402-qyepd) won with official x402 middleware, a live paid service and visible settlement evidence. Scout has the same real settlement foundation but still needs public deployment and visible receipts.

## Official requirements

1. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), The Graph requirements.
2. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), Privy requirements.
3. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), ENS, Bazantic, Hedera and Uniswap requirements.
