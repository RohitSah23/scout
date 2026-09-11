# Demo Script (3:30)

1. **0:00 Problem** — On-chain and web data live in different worlds
2. **0:15 Prompt** — "Analyze Base lending. $0.50 budget."
3. **0:30 Graph** — MCP discovery + "1 query × N protocols" + live metrics
4. **1:10 OpenSEO** — Search gap vs on-chain growth
5. **1:35 Score** — Uncertainty gate triggers x402
6. **1:50 Payment** — 402 → Privy sign → settled
7. **2:10 ENS** — scout-agent.eth + permission summary + public MCP record
8. **2:30 Result** — cbBTC on Aave V3, opportunity 53.7, risk 30, spend report
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
- ENS `agent.mcp` readback and [public MCP update transaction](https://sepolia.etherscan.io/tx/0x968cc1b7fc77a268815be40e55d2d197b11ebdcbb1015f88216c904467e22665)
- Public app: <https://scout-web-ethglobal-2026.onrender.com>
- Replayable paid production report: <https://scout-web-ethglobal-2026.onrender.com/research/f28e5c0e-0081-435c-8cad-18b60713534f>
- Production x402 receipt: <https://sepolia.basescan.org/tx/0xe3bd6a4311c7b5cf49372e1f0bb58905a7b3f9b8c5e8b371c5672cac2307356b>
