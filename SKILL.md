---
name: scout-protocol-opportunity
description: Use Scout when an agent needs a cited, live comparison of lending opportunities across blockchain protocols.
---

# Scout protocol opportunity research

Use Scout for questions that combine live on-chain lending activity with search demand, competition, risk, and a ranked developer opportunity.

## Call the tool

Connect to the Streamable HTTP MCP endpoint at `${PUBLIC_API_URL}/mcp` and call `protocol_opportunity_analysis` with:

- `request`: the decision the user wants to make
- `chain`: the chain to compare, currently `base`
- `budget`: maximum research budget in USDC

The tool returns a research session containing sources, candidates, per-dimension scores, confidence, the decision log, and either a final recommendation or an `awaiting_payment` state.

## Handle payment

Never invent payment success. If Scout returns `awaiting_payment`, show the price, reason, payee, remaining budget, and candidate to the user. The user-authorized API route performs a policy-controlled Privy x402 payment. Treat the purchase as settled only when the session includes a real transaction reference.

## Present evidence

Name the Graph deployment or subgraph IDs and distinguish source observations from Scout's derived scores. Report missing or failed sources explicitly. Link settlement and ENS transactions when present. If those integrations are unconfigured, say so rather than describing them as completed.
