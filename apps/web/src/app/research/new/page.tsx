"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useStartResearch } from "@/lib/hooks/useStartResearch";
import { ErrorState } from "@/components/ui/ErrorState";

function MissionConfig() {
  const params = useSearchParams();
  const [prompt, setPrompt] = useState(
    params.get("prompt") ??
      "Rank the top lending assets across Base protocols. Which token market has the best opportunity for a new developer product?",
  );
  const [chain, setChain] = useState("base");
  const [category, setCategory] = useState("lending");
  const { start, loading, error } = useStartResearch();

  return (
    <ScoutShell>
      <div className="max-w-scout mx-auto px-4 md:px-8 py-12 md:py-16">
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wide mb-2">
          Research Mission
        </h1>
        <p className="text-ink/70 mb-8">What should Scout investigate?</p>

        {error && <div className="mb-8"><ErrorState message={error} /></div>}

        <div className="max-w-2xl space-y-6">
          <Textarea
            label="Mission"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="text-base"
          />

          <div className="grid sm:grid-cols-2 gap-4 font-mono text-sm">
            <label className="space-y-2">
              <span className="font-display text-xs uppercase tracking-widest text-ink/60">Chain</span>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full border-brutal bg-paper px-3 py-2"
              >
                <option value="base">Base</option>
                <option value="ethereum">Ethereum</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="polygon">Polygon</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="font-display text-xs uppercase tracking-widest text-ink/60">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-brutal bg-paper px-3 py-2"
              >
                <option value="lending">Lending</option>
                <option value="dex">DEX</option>
              </select>
            </label>
          </div>

          <Button
            loading={loading}
            onClick={() => start({ request: prompt, chain, category })}
          >
            Start Mission
          </Button>
        </div>
      </div>
    </ScoutShell>
  );
}

export default function NewResearchPage() {
  return (
    <Suspense>
      <MissionConfig />
    </Suspense>
  );
}
