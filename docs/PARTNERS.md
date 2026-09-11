# Partners

## The Graph
- Live queries use `https://gateway.thegraph.com/api/<KEY>/subgraphs/id/<ID>`.
- Standardized Messari Lending/CDP deployments share one query pattern; native adapters are labelled separately.
- The Graph is load-bearing: research fails if live Graph data cannot be obtained.

## OpenSEO
- Scout calls the OpenSEO MCP endpoint for keyword and SERP evidence.
- OpenSEO is product intelligence and is not an ETHOnline prize partner.

## x402
- Paid route: `POST /api/deep-protocol-analysis` at 0.03 USDC.
- Official x402 v2 Hono middleware verifies and settles through the configured facilitator on Base Sepolia.
- An arbitrary header never unlocks the resource.

## Privy
- Browser login provides an access token; production API routes verify it server-side.
- A policy-controlled Privy server wallet signs the x402 EIP-712 authorization.
- `scripts/provision-privy.mjs` creates the restricted policy and wallet after explicit review.

## ENSv2
- The viem adapter writes directly to a configured Sepolia Permissioned Resolver.
- Missing configuration fails closed. Eligibility begins only after real onchain proof exists.

## Bazantic
- OpenAPI: `GET /openapi.json`
- MCP: Streamable HTTP at `/mcp`
- Local recipe template: `GET /bazantic/recipe`
- The template is not a published Bazantic gateway or recipe.
