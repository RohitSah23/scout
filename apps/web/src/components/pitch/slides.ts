export interface SlideItem {
  label?: string;
  text: string;
  href?: string;
}

export interface SlideLink {
  href: string;
  label: string;
}

export interface Slide {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  items?: SlideItem[];
  quote?: string;
  closing?: string;
  links?: SlideLink[];
  notes: string;
}

export const SLIDES: Slide[] = [
  {
    id: "title",
    kicker: "01",
    title: "Scout",
    lead: "Autonomous protocol intelligence agent",
    items: [
      { text: "ETHOnline 2026 · Start Fresh" },
      {
        text: "Ranks live Base lending from The Graph. Pays for extra evidence after authorization. Writes the result to scout-agent.eth.",
      },
    ],
    links: [
      {
        href: "https://scout-web-ethglobal-2026-y6tp.onrender.com/",
        label: "scout-web-ethglobal-2026-y6tp.onrender.com",
      },
    ],
    notes:
      "Judges, this is Scout. You type a research question. You do not connect a wallet. Scout pulls live Graph data, scores the market, and if it is not sure, it asks you to authorize three cents from its policy wallet for more evidence. Then it writes the result on-chain as scout-agent.eth.",
  },
  {
    id: "problem",
    kicker: "02",
    title: "Problem",
    lead: "On-chain activity and search demand live in different worlds.",
    items: [
      {
        text: "Contracts show what users are doing. Search shows what builders are looking for. Those signals are usually analyzed separately.",
      },
      {
        text: "Lending markets move faster than blog posts. TVL and SERP tell different stories.",
      },
      { text: "Builders guess which token market to ship against." },
    ],
    notes:
      "Crypto research is split. The Graph can show how cbBTC is moving on Aave. OpenSEO adds evidence about search visibility and content gaps. Scout puts those two signal layers into one cited decision instead of asking a builder to reconcile separate dashboards manually.",
  },
  {
    id: "solution",
    kicker: "03",
    title: "Solution",
    lead: "Ask → Graph + OpenSEO → score → buy evidence if uncertain → ENS report.",
    items: [
      { text: "No Connect Wallet. The visitor does not fund the $0.03 evidence payment." },
      { text: "The Graph is load-bearing. If live data fails, research stops." },
      {
        text: "After authorization, a Privy policy treasury pays x402. ENSv2 supplies runtime identity, permissions and a budget cap.",
      },
    ],
    notes:
      "The product is a single loop. You ask. Scout discovers Base lending through The Graph and enriches it with search demand. It scores six evidence dimensions. If the answer is too close or confidence is thin, it pauses for authorization and buys candidate-specific diagnostics. Then it writes status to scout-agent.eth. You never paste a private key. Scout’s wallet does the spend, inside a cap.",
  },
  {
    id: "how-it-works",
    kicker: "04",
    title: "How it works",
    items: [
      { label: "01 Ask", text: "Type a prompt. No wallet. No visitor login required." },
      {
        label: "02 The Graph",
        text: "One Messari Lending/CDP query across protocols on Base. Live Gateway data.",
      },
      {
        label: "03 Score",
        text: "On-chain + SEO + confidence. If the answer is thin, Scout asks to buy extra evidence.",
      },
      {
        label: "04 Authorize",
        text: "Scout’s Privy policy wallet pays ~$0.03 USDC via x402. The visitor is not charged.",
      },
      {
        label: "05 ENSv2",
        text: "Status write on scout-agent.eth. Report you can verify on-chain.",
      },
    ],
    notes:
      "Five steps, all in the product. Ask. Graph. Score. Authorize. ENS. The visitor stays on the page. Scout uses separate policy and ENS wallets on their respective testnets, with both roles visible in one research session.",
  },
  {
    id: "graph",
    kicker: "05",
    title: "The Graph",
    lead: "One query × N protocols. Native adapters labeled separately.",
    items: [
      {
        text: "Same Messari Lending/CDP template across Moonwell, Seamless, Compound V3, QiDao, and Aave V3.",
      },
      {
        text: "Aave native 1-hour event subgraph is a separate adapter, labeled as native — not mixed into the standard results.",
      },
      { text: "Live run: 16 token/market candidates from 20 initial sources." },
      { text: "Graph failure stops research. Public Streamable HTTP MCP + SKILL.md." },
    ],
    notes:
      "This is the Graph prize story. We did not write five custom queries. We wrote one Messari template and pointed it at five standardized deployments. That is the leverage of the standard schema — new protocols drop in. Aave’s one-hour events are extra, and we label them native so judges can see what is standardized versus what is not. If the gateway is down, Scout does not hallucinate TVL. It fails. Other agents can call the same research through our MCP tool.",
  },
  {
    id: "uncertainty",
    kicker: "06",
    title: "Uncertainty gate",
    lead: "Scout makes its decision thresholds explicit.",
    items: [
      {
        text: "Model: onchain growth 30% · user growth 20% · search demand 20% · competitive gap 15% · SEO opportunity 10% · evidence confidence 5%.",
      },
      { text: "Trigger: top-two opportunity gap ≤ 5 points or confidence < 70%." },
      { text: "Clear result: leader ahead by > 10 points and confidence ≥ 75%." },
      {
        text: "Action after visitor authorization: official x402 v2 candidate diagnostics at $0.03 USDC on Base Sepolia.",
      },
      {
        text: "A random payment header never unlocks the route. Unpaid requests return HTTP 402.",
      },
    ],
    notes:
      "Most AI demos always look confident. Scout has an explicit uncertainty gate. If the top two scores are within five points, or evidence confidence is below seventy percent, it stops and asks to buy candidate-specific diagnostics. That purchase is a real HTTP 402 using official middleware. Three cents of testnet USDC. No header spoofing. The visitor decides whether the policy wallet should proceed.",
  },
  {
    id: "privy",
    kicker: "07",
    title: "Privy financial flow",
    lead: "The visitor is not charged. Scout’s policy wallet is.",
    items: [
      {
        text: "Payer: 0x38B28037192d6b44B537c2c6F717f150a1989E69",
        href: "https://sepolia.basescan.org/address/0x38B28037192d6b44B537c2c6F717f150a1989E69",
      },
      {
        text: "Policy: eebmveuo1rtadd1pua6vll2x — Base Sepolia USDC EIP-3009 only, allowlisted payee, max 0.10 USDC",
      },
      {
        text: "Deployed testnet settlement: 0.03 USDC on Base Sepolia",
        href: "https://sepolia.basescan.org/tx/0xe3bd6a4311c7b5cf49372e1f0bb58905a7b3f9b8c5e8b371c5672cac2307356b",
      },
      {
        text: "UI keeps payer, payee, amount, policy ID, service URL, timestamp, and Basescan link in one receipt",
      },
    ],
    notes:
      "Privy is the financial flow, not a login badge. There is no seed in the browser. A restricted server wallet signs the x402 authorization. The policy is hard: this chain, this USDC, this payee, ten cents maximum. We funded it, we settled three cents, and the receipt is on Basescan and in the report. If you take the policy off, the agent cannot pay. That is the control.",
  },
  {
    id: "ens",
    kicker: "08",
    title: "ENSv2 control plane",
    lead: "scout-agent.eth is infrastructure, not a sticker.",
    items: [
      { text: "Permissioned Resolver on Ethereum Sepolia. Forward resolution: 0x9BCB…3eaE" },
      {
        text: "research.budget is read before an x402 purchase. agent.mcp resolves to the public MCP URL.",
      },
      {
        text: "Agent holds record-scoped ROLE_SET_TEXT for research.status and research.lastReport only.",
      },
      {
        text: "Authorized write succeeds",
        href: "https://sepolia.etherscan.io/tx/0x2b65dbcf1de552eb8c31ad20d39a84107d6c59fe0b85f572c36461b8a1a0235b",
      },
      {
        text: "Unauthorized write is mined and reverts",
        href: "https://sepolia.etherscan.io/tx/0xebc0c9435af2af0c1146d28b03b526082dd50b3c0556709254f95ae0fec2f831",
      },
    ],
    notes:
      "ENS is in the runtime path. Scout resolves the name, reads the budget cap, and only then authorizes payment. The agent can update status and last report. It cannot change the resolver or the root. We proved that with two transactions: the agent write lands, the unauthorized key is mined and reverts. The MCP URL you would give another agent is an ENS text record, not a hardcoded string in a README.",
  },
  {
    id: "proof",
    kicker: "09",
    title: "Proof",
    lead: "Replayable deployed testnet run. Public endpoints. Explorer links.",
    items: [
      {
        text: "Report: cbBTC on Aave V3 — opportunity 52.0, risk 30, 100% confidence, 21 evidence sources",
        href: "https://scout-web-ethglobal-2026-y6tp.onrender.com//research/f28e5c0e-0081-435c-8cad-18b60713534f",
      },
      {
        text: "Earlier verified paid run of the same loop: opportunity 53.7, risk 30, 16 candidates, 20 initial sources, $0.03 spent",
      },
      { text: "Payments on Base Sepolia. ENS on Ethereum Sepolia. Separate wallets. Separate explorers." },
    ],
    links: [
      {
        href: "https://scout-web-ethglobal-2026-y6tp.onrender.com/",
        label: "Web",
      },
      {
        href: "https://scout-api-ethglobal-2026-rljy.onrender.com/health",
        label: "API health",
      },
      {
        href: "https://scout-api-ethglobal-2026-rljy.onrender.com/mcp",
        label: "MCP",
      },
      {
        href: "https://scout-api-ethglobal-2026-rljy.onrender.com/openapi.json",
        label: "OpenAPI",
      },
    ],
    notes:
      "Do not take our word. Open the report. You will see the Graph sources, the score breakdown, the Privy receipt, and the ENS identity. The replayable Render report’s winner is cbBTC on Aave V3 at fifty-two opportunity, thirty risk. An earlier verified run scored fifty-three point seven. Same winner, but separately reported evidence counts. Two networks on purpose: Base Sepolia for USDC and Ethereum Sepolia for ENSv2.",
  },
  {
    id: "differentiated",
    kicker: "10",
    title: "What is differentiated",
    lead: "One research loop joins standardized data, explicit uncertainty and verifiable agent controls.",
    items: [
      {
        label: "Graph research",
        text: "A standardized Messari query, a public MCP tool and a labeled native adapter.",
      },
      {
        label: "Evidence purchase",
        text: "An explicit uncertainty gate, bounded x402 spend and an explorer-linked receipt.",
      },
      {
        label: "Agent control plane",
        text: "A real ENSv2 name, record-scoped EAC and an onchain budget cap.",
      },
    ],
    notes:
      "Scout’s differentiation is the connected loop. Standardized Graph evidence drives the ranking. Explicit uncertainty decides when more evidence is worth buying. Privy and x402 constrain and prove the spend. ENS supplies the agent name, scoped permissions, budget and MCP location. We are not stretching into prizes we did not finish.",
  },
  {
    id: "close",
    kicker: "11",
    title: "Close",
    lead: "Demo prompt",
    quote:
      "Rank the top lending assets across Base protocols. Which token market has the best opportunity for a new developer product? I have a $0.50 research budget.",
    closing: "Scout turns uncertain Web3 questions into defensible, paid, on-chain decisions.",
    links: [
      { href: "https://github.com/RohitSah23/scout", label: "Repo" },
      { href: "https://scout-web-ethglobal-2026-y6tp.onrender.com/", label: "App" },
      {
        href: "https://scout-web-ethglobal-2026-y6tp.onrender.com/pitch-deck",
        label: "Deck",
      },
      {
        href: "https://scout-web-ethglobal-2026-y6tp.onrender.com//research/f28e5c0e-0081-435c-8cad-18b60713534f",
        label: "Report",
      },
      { href: "https://scout-api-ethglobal-2026-rljy.onrender.com/mcp", label: "MCP" },
    ],
    notes:
      "If you remember one sentence: Scout turns uncertain Web3 questions into defensible, paid, on-chain decisions. Live Graph. A three-cent policy payment when the answer is thin. A name you can resolve. That is the demo. Thank you.",
  },
];
