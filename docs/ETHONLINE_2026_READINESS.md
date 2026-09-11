# ETHOnline 2026 prize readiness and production plan

Research date: 11 September 2026. Repository baseline: `dev` at `a7db464`. The first repository commit is dated 5 September 2026, after the event began, so Scout should enter the **Start Fresh** pools. Confirm this classification in the ETHGlobal submission form.

## Decision

Scout's strongest submissions are:

1. **The Graph — Best Use of Composable or Standardized Graph Products**
2. **The Graph — Best AI Tooling or AI Use Case (From Scratch)**
3. **Privy — Best B2B financial product**, after one real policy-controlled x402 payment is completed
4. **Bazantic — Best Recipe using sponsor APIs**, after the deployed API is imported and the recipe is published

Do not submit for ENSv2 until the Sepolia name, Permissioned Resolver, EAC grant, successful status write, and rejected unauthorized write can all be shown with explorer links. Do not claim Privy financial-flow eligibility until the wallet is funded and the real payment is settled.

## Criteria matrix

| Prize | Official threshold | Scout now | Gap before submission | Readiness |
|---|---|---|---|---:|
| Graph standardized, $5,000 | A standardized schema or 2+ composed Graph products; live provider data; explain standards leverage; public repo and 2–4 minute video [1] | Live Graph gateway queries, a shared Messari lending query across multiple protocols, provenance, ranking, plus native adapters | Deploy; capture successful query evidence; clearly label native adapters separately from standardized results; record video | 85% |
| Graph AI, Start Fresh, $5,000 | Graph must be load-bearing and live; the app must reason, decide, automate, or accept natural language; clear README/SKILL; public repo and 2–4 minute video [1] | Graph failure stops research, deterministic six-dimension scoring, uncertainty gate, OpenRouter narrative, and a real Streamable HTTP MCP tool | Add `SKILL.md`; deploy MCP/API; capture a live end-to-end run; document first-commit date | 80% |
| Privy B2B, $2,500 | Use a Privy wallet, a real business workflow, and a Privy control such as a policy; provide working demo/source [2] | Privy login/access-token verification and code for a policy-controlled Privy server wallet paying an x402 service | Create the restricted policy and wallet; fund with Base Sepolia USDC; run one settled payment; show wallet, policy and transaction | 65% code / 0% settlement |
| Privy financial flow, $2,500 | A real supported financial flow using a Privy wallet; mocks do not count as the required integration [2] | Same x402 payment path | Confirm with Privy that x402 EIP-3009 signing is accepted as an eligible wallet action; otherwise add a direct transfer/funding action | 50% |
| Bazantic sponsor recipe, $1,000 | Bazantic account, x402/MPP gateway, another sponsor service, two-service recipe whose result depends on both, recording, username [3] | Real OpenAPI document, MCP server and a truthful local integration manifest | Deploy publicly; create gateway in Bazantic; publish Graph → Scout recipe; record full flow; add account handle | 45% |
| ENSv2, $4,500 | ENSv2 Sepolia must be central, functional, open source and demonstrated; values cannot be hard-coded [4] | Real viem reads/writes and fail-closed configuration are implemented | Provision real ENSv2 subname and Permissioned Resolver; grant scoped EAC role; write records; prove an unauthorized signer reverts; expose explorer links | 35% code / 0% onchain proof |

## What was short in the audited repository

The Graph path was the one real, prize-relevant integration. The earlier x402 endpoint accepted the presence of a payment header without verifying or settling it. The Privy adapter kept balances in memory and fabricated `privy-tx-*` receipts. ENS returned in-memory records and fabricated transaction hashes. The Bazantic endpoint was metadata shaped like MCP, rather than an MCP protocol server, and no Bazantic gateway or published recipe existed. The paid analysis inserted fixed fallback values for wallet growth, retention, and whale concentration. Those behaviors would fail the partners' explicit functional and no-mock requirements.

There was also an evidence integrity issue: every runtime log entry was appended twice. Several docs described Graph gateway calls as Subgraph MCP calls and described integrations as complete before there was transaction evidence.

## Changes made in this audit

- Replaced the deep-analysis gate with official x402 v2 Hono middleware using `x402ResourceServer`, `HTTPFacilitatorClient`, `ExactEvmScheme`, Base Sepolia and USDC. A random payment header no longer unlocks the route.
- Added a real x402 payer and a Privy payer based on a Privy-managed viem account. Both reject missing configuration and require a settlement transaction reference.
- Added a restricted Privy provisioning script. Its policy limits EIP-712 signing to Base Sepolia USDC, the configured recipient, and at most 0.10 USDC per authorization.
- Added optional Privy access-token verification to research and payment authorization endpoints; production enables it with `PRIVY_REQUIRE_AUTH=true`.
- Replaced ENS simulation with direct Sepolia Permissioned Resolver text reads/writes through viem. Missing keys or resolver addresses produce an explicit unconfigured/failure state. The unauthorized test requires a second real key.
- Removed invented paid-analysis fallbacks. Diagnostics now report only supplied observed fields and publish their methodology.
- Replaced the fake `/mcp` metadata response with a real stateless Streamable HTTP MCP server and tool.
- Added `/openapi.json` for a Bazantic gateway and marked the Bazantic manifest as an integration template until it is actually published.
- Fixed duplicated decision logs.

## What comparable showcase projects teach us

The most useful benchmark is **deeptrace**, a Graph prize winner. It combined standardized Messari subgraphs across Aave, Seamless and Moonwell, exposed a read-only MCP server, added a custom wallet-level indexer, reported partial failures explicitly, shipped a `SKILL.md`, and deployed a public endpoint [5]. Scout already has broader ranking and a polished decision workflow, but deeptrace has better wallet-level evidence and agent installation material.

**PlanBound** makes policies independently verifiable: the same account that holds the approved ceiling pays, live prices are rechecked, and Graph reconciliation checks what settled [6]. Scout should copy the evidence pattern: display policy ID, Privy wallet address, exact amount, payee, x402 receipt, transaction hash and explorer link in one panel.

**Kinora** binds the paid request to the negotiated terms and persists an idempotent post-settlement chain [7]. Scout now sends the exact candidate evidence in the paid request, but production should add an idempotency key and database uniqueness constraint so a retry cannot charge twice.

**Namesake** treats ENS as provisioning infrastructure: a real subname, records, agent wallet and a visible multi-step state machine [8]. A single status text record will look cosmetic beside it. Scout's ENS story becomes competitive when the ENS name resolves the MCP endpoint, encodes the budget policy, and delegates only the status/report record roles to the agent.

**Glassbox402** uses official x402 middleware, has a live paid service, keeps the seller server free of buyer private keys, and exposes payment evidence in a dashboard [9]. Scout now follows the official middleware path, but still needs the public deployment and first settlement receipt.

## Production sequence

### P0 — security and truthful baseline

1. Rotate every credential pasted into chat: OpenRouter, The Graph, OpenSEO, Privy secret, and any wallet key. Treat all of them as compromised. The current `X402_PRIVATE_KEY` is only address-length and cannot sign an EVM transaction.
2. Keep secrets only in the deployment provider's encrypted environment and local ignored `.env`; never in screenshots, logs, fixtures or commits.
3. Preserve the current fail-closed behavior. No demo mode should fabricate receipts, balances, ENS records, metrics or transaction hashes.

### P1 — produce one verifiable Privy/x402 receipt

1. Review and run `npm run provision:privy` to create the restricted policy and wallet.
2. Add the returned `PRIVY_WALLET_ID` and `PRIVY_POLICY_ID` to the environment.
3. Fund that address with Base Sepolia ETH for any required gas and at least 0.10 test USDC.
4. Deploy the API over HTTPS and set `PUBLIC_API_URL` and `DEEP_ANALYSIS_URL` to that origin.
5. Start research while logged in through Privy, approve the uncertainty purchase, and verify 402 → Privy EIP-712 signature → facilitator settlement → 200.
6. Store and show the settlement transaction, payer address, recipient, amount, policy ID, service URL and explorer link. Add an idempotency key before repeating payments.

### P2 — make ENSv2 central

1. Register or obtain a Sepolia parent and agent subname.
2. Give the agent subname its own Permissioned Resolver.
3. Set `agent.type`, `agent.mcp`, `research.budget`, `research.status` and `research.lastReport` onchain.
4. Grant the agent key only the roles needed to update status/report records through EAC.
5. Run the authorized endpoint and capture its transaction. Run the unauthorized endpoint with a separately funded key and capture the revert.
6. Make the app resolve the MCP URL and budget from ENS before using them. This turns ENS from a final badge into a control-plane dependency.

### P3 — deploy and complete Bazantic

1. Deploy web and API with separate production origins, restricted CORS, persistent session storage, HTTPS health checks and structured logs.
2. Validate `GET /openapi.json` and MCP initialize/tools/call against the public URL.
3. In Bazantic, create an x402/MPP gateway from the OpenAPI URL.
4. Publish a recipe where Graph-derived protocol evidence becomes input to Scout scoring and the final recommendation fails if either service is missing.
5. Run the required same-prompt comparison and record inputs/results, then record the complete recipe flow and add the Bazantic username to the submission.

### P4 — submission evidence

- Put a “Proof” section in the README with the deployed app, API health, MCP URL, Graph source/deployment IDs, Privy wallet/policy, x402 transaction, ENS name/resolver/transactions, and Bazantic recipe.
- Add a `SKILL.md` explaining when and how an agent calls Scout.
- Record a 2–4 minute video with no prerecorded or hard-coded result: new prompt, live Graph sources, score/gate, real payment, receipt, ENS read/write, final report.
- Capture failure demonstrations: invalid/no payment gets 402, over-cap payment is rejected, missing Privy token gets 401, unauthorized ENS writer reverts, and a failed data source is disclosed.

## Verification performed

- TypeScript builds passed for schemas, x402, Privy, ENS, deep analysis, agent runtime and API.
- API health returned HTTP 200.
- An unpaid deep-analysis POST returned HTTP 402 with a valid `payment-required` header specifying x402 v2, Base Sepolia (`eip155:84532`), USDC, 30,000 base units, and the configured payee.
- MCP initialize returned HTTP 200 with protocol version `2025-06-18` and the `scout-research` server identity.
- A full Next.js production compile succeeded; its later type check exposed and then received a fix for an optional metric value. Run the final complete build again after credentials are rotated.
- No real payment or ENS write was claimed. Those require the external wallet/name provisioning above.

## Sources

1. [ETHOnline 2026 prize criteria — The Graph](https://ethglobal.com/events/ethonline2026/prizes)
2. [ETHOnline 2026 prize criteria — Privy](https://ethglobal.com/events/ethonline2026/prizes)
3. [ETHOnline 2026 prize criteria — Bazantic](https://ethglobal.com/events/ethonline2026/prizes)
4. [ETHOnline 2026 prize criteria — ENS](https://ethglobal.com/events/ethonline2026/prizes)
5. [deeptrace — The Graph prize winner](https://ethglobal.com/showcase/deeptrace-7fqoz)
6. [PlanBound showcase](https://ethglobal.com/showcase/planbound-wqxy5)
7. [Kinora showcase](https://ethglobal.com/showcase/kinora-5dtqg)
8. [Namesake showcase](https://ethglobal.com/showcase/namesake-kq1ez)
9. [Glassbox402 — Hedera prize winner and ETHGlobal finalist](https://ethglobal.com/showcase/glassbox402-qyepd)
10. [The Graph standardized subgraphs documentation](https://thegraph.com/docs/en/subgraphs/existing-subgraphs/standard-subgraphs/)
11. [x402 official repository and production-path guidance](https://github.com/x402-foundation/x402)
12. [Privy organization wallets](https://docs.privy.io/wallets/overview/solutions/organization-wallets)
13. [Privy wallet policies](https://docs.privy.io/controls/policies/overview)
