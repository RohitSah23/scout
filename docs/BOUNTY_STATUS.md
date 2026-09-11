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
| The Graph — AI Tooling / AI Use Case, $5,000 | **Technical qualification met** | The Graph is load-bearing; live Gateway data drives 16-asset ranking, scoring, an uncertainty decision and natural-language output. Scout exposes a live public Streamable HTTP MCP tool and `SKILL.md`. The repository and deployment are public. | Record and submit the required 2–4 minute video. |
| The Graph — Composable / Standardized Products, $5,000 | **Technical qualification met** | One Messari Lending/CDP query template runs across four standardized protocol deployments. The live run labels standardized and native adapters separately and explains the leverage of the shared schema. | Record and submit the required 2–4 minute video. Put the four deployment IDs and one shared query in the README proof section. |
| Privy — Best financial flow, $2,500 | **Technical qualification met** | A real Privy server wallet, attached signing policy and SDK signer completed a $0.03 Base Sepolia USDC x402 payment. The session and final UI preserve the payer, payee, policy ID, amount, service, network, timestamp and Basescan settlement link. | Record the working flow and explain how Privy removes seed/key handling. |
| Privy — Best B2B financial product, $2,500 | **Partial / weak fit** | Wallet administration, a spending policy and an agent-to-service payment exist. | The product does not yet demonstrate a clear business or organization workflow such as a shared treasury, roles, approvals or quorum. Do not prioritize this over Best financial flow. |
| Bazantic — Best Recipe using sponsor APIs, $1,000 | **Partial** | Scout exposes OpenAPI, Streamable HTTP MCP and a truthful local recipe manifest that combines Graph and Scout analysis. | Create the Bazantic account and public x402/MPP Gateway, publish the two-service recipe, run the required comparison, record it and provide the account username. Local metadata does not qualify. |
| ENS — Best Use of ENSv2, $4,500 | **Technical qualification met** | scout-agent.eth is registered on ENSv2 Sepolia with a per-owner Permissioned Resolver. Separate Privy owner, agent and unauthorized wallets prove record-scoped EAC: the agent write succeeds and the attacker transaction is mined and reverts. Forward resolution, records and role bitmaps were read back live; research.budget constrains x402 authorization; agent.mcp resolves to the public Render MCP service. | Record the working identity/permission/payment flow. |
| Uniswap Foundation — Stack Contribution | **Not eligible** | A Uniswap v3 swap was used operationally to fund the test wallet. | The swap is not a feature in the repository. There is no Uniswap product integration, `FEEDBACK.md`, or submitted feedback form. |
| Hedera — AI & Agentic Payments | **Not eligible** | The adapter fails closed and accurately states that Hedera settlement is unavailable. | A live Hedera x402 service through Blocky402 and a real Hedera paid request are mandatory. The verified Base Sepolia payment does not count. |
| Arc, World, 1inch, Ledger, Chainlink | **Not eligible** | None. | Each requires its named stack; Scout does not integrate those products. |

## Verified live evidence

- Public repository: <https://github.com/8dazo/scout/tree/dev>
- Public web app: <https://scout-web-ethglobal-2026.onrender.com>
- Public API/MCP: <https://scout-api-ethglobal-2026.onrender.com> / <https://scout-api-ethglobal-2026.onrender.com/mcp>
- Qualification implementation: commit [`3d74c61`](https://github.com/8dazo/scout/commit/3d74c61c3fe0163d549b0088632089e9ba70658c)
- Privy payer: `0x38B28037192d6b44B537c2c6F717f150a1989E69`
- Privy policy: `eebmveuo1rtadd1pua6vll2x`
- Wallet funding swap: [0x7c771b…beff1](https://sepolia.basescan.org/tx/0x7c771bbf6b70ea8b2e3ef229344f924b3bd7ac869462c09f68ef2ccfaf3beff1)
- x402 payment: [0xb66194…df537](https://sepolia.basescan.org/tx/0xb66194b37432059c1fba839d66e924281ed5984a5580c6ca2d9ad342a11df537)
- Production Render report: <https://scout-web-ethglobal-2026.onrender.com/research/f28e5c0e-0081-435c-8cad-18b60713534f>
- Production Render x402 payment: [0xe3bd6a…07356b](https://sepolia.basescan.org/tx/0xe3bd6a4311c7b5cf49372e1f0bb58905a7b3f9b8c5e8b371c5672cac2307356b)
- ENSv2 identity: scout-agent.eth → 0x9BCBB965C4886dDc4ab769f6141a1Ea26a593eaE
- ENSv2 Permissioned Resolver: [0x846e68…b9dbd](https://sepolia.etherscan.io/address/0x846e68ecd4fEe028C776bf5642D242De762b9dbd)
- ENSv2 authorized agent write: [0x2b65db…0235b](https://sepolia.etherscan.io/tx/0x2b65dbcf1de552eb8c31ad20d39a84107d6c59fe0b85f572c36461b8a1a0235b)
- ENSv2 unauthorized on-chain revert: [0xebc0c9…2f831](https://sepolia.etherscan.io/tx/0xebc0c9435af2af0c1146d28b03b526082dd50b3c0556709254f95ae0fec2f831)
- ENSv2 public MCP record update: [0x968cc1…22665](https://sepolia.etherscan.io/tx/0x968cc1b7fc77a268815be40e55d2d197b11ebdcbb1015f88216c904467e22665)
- Paid run: 16 candidates, 20 initial sources, $0.03 USDC spent, cbBTC on Aave V3 selected with a 53.7 opportunity score and 30 risk score.
- Clean install, configured tests, TypeScript packages and the production Next.js build pass. The root lint command currently has no lint tasks and should not be presented as lint coverage.

## Submission-critical work

1. Record one 2–4 minute video: prompt → standardized Graph deployments → 16-asset ranking → uncertainty gate → Privy approval → onchain payment → ENS identity/MCP record → paid result.
2. Submit to both Graph prizes, Privy Best financial flow and ENS Best Use of ENSv2.
3. Complete Bazantic only after the primary submissions are ready.

## Winner benchmarks

- [deeptrace](https://ethglobal.com/showcase/deeptrace-7fqoz), a previous The Graph prize winner, used standardized Messari data across Aave, Seamless and Moonwell, a read-only MCP server, `SKILL.md`, explicit partial failures and a deployed endpoint. Scout now matches the standardized/MCP/deployment pattern and adds live scoring plus paid uncertainty resolution; the submission video is the remaining judge-facing deliverable.
- [PlanBound](https://ethglobal.com/showcase/planbound-wqxy5) displayed live 402 prices, bounded spending and independently verifiable settlement. Scout should copy its evidence presentation by putting the wallet, policy, amount, payee and receipt together.
- [Namesake](https://ethglobal.com/showcase/namesake-kq1ez) made ENS provisioning central through a real subname, records and an agent wallet. It shows why Scout's current unconfigured ENS code is not yet enough.
- [Glassbox402](https://ethglobal.com/showcase/glassbox402-qyepd) won with official x402 middleware, a live paid service and visible settlement evidence. Scout now has the same real settlement foundation, a public service and visible onchain receipts.

## Official requirements

1. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), The Graph requirements.
2. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), Privy requirements.
3. ETHGlobal, [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes), ENS, Bazantic, Hedera and Uniswap requirements.
