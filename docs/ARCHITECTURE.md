# Architecture

Scout is a TypeScript monorepo with adapter-based partner integrations.

## Apps

- `apps/web` — Next.js multi-route product UI (Research, Reports, Agent) with neo-brutalist design system, investigation timeline, payment authorization, and evidence drawer
- `apps/api` — Hono REST + typed SSE + payment pause/resume + research list + x402-gated deep analysis + Bazantic recipe endpoint
- `apps/agent` — CLI orchestrator

## Packages

- `@scout/schemas` — Zod types and adapter interfaces
- `@scout/scoring` — Six-dimension opportunity score + risk + uncertainty gate
- `@scout/graph` — Messari Lending/CDP registry + Graph gateway queries
- `@scout/openseo` — OpenSEO MCP enrichment
- `@scout/x402` — Budget policy + payment provider
- `@scout/privy` — Org wallet + policy controls
- `@scout/ens` — ENSv2 identity + EAC permissions
- `@scout/bazantic` — Recipe manifest
- `@scout/llm` — OpenRouter client for recommendation narration
- `@scout/agent-runtime` — Research orchestration loop

## Flow

1. User prompt + budget → API starts research session
2. Graph: discover + query standardized lending subgraphs
3. OpenSEO: enrich with web/SEO metrics
4. Scoring: provisional rank → uncertainty gate
5. If uncertain: pause at `awaiting_payment`, emit `payment.required` SSE event; user authorizes via `POST /research/:id/authorize-payment`
6. x402: deep analysis payment via Privy policy (after authorization)
7. ENS: write research.status on completion
8. OpenRouter: narrate final recommendation from fixed score breakdown
9. Typed SSE events (`graph.discovery`, `payment.required`, etc.) stream to web UI; `GET /research` lists completed sessions

## Web routes

- `/` — Landing + research composer
- `/research/new` — Mission configuration
- `/research/[id]` — Live investigation + report tabs
- `/reports` — Completed research library
- `/agent` — Agent identity, permissions, treasury
