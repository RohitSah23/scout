# Demo Script (3:30)

1. **0:00 Problem** — On-chain and web data live in different worlds
2. **0:15 Prompt** — "Analyze Base lending. $0.50 budget."
3. **0:30 Graph** — MCP discovery + "1 query × N protocols" + live metrics
4. **1:10 OpenSEO** — Search gap vs on-chain growth
5. **1:35 Score** — Uncertainty gate triggers x402
6. **1:50 Payment** — 402 → Privy sign → settled
7. **2:10 ENS** — scout.ethonline.eth + permission summary + status write
8. **2:30 Result** — Score 88, risk 34, spend report
9. **3:10 Close** — One-liner for judges

## Demo prompt

```
Rank the top lending assets across Base protocols. Which token market has the best opportunity for a new developer product? I have a $0.50 research budget.
```

## Token leaderboard pitch (30s)

Scout discovers Moonwell, Seamless, Aave, and QiDao on Base. One Messari query template per protocol pulls the top 5 markets each. Aave adds 1-hour live event data. Result: a cross-protocol token leaderboard — e.g. cbBTC on Aave ranks #1 for short-term lending activity.

## Evidence to capture

- Subgraph discovery log
- Same query template across protocols
- OpenSEO tool output in sources
- 402 response headers
- Privy policy chips + spend tx
- ENS Sepolia success transaction and unauthorized-write revert
