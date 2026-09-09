"use client";

import { useState } from "react";
import { ScoutShell } from "@/components/shell/ScoutShell";
import { ResearchComposer } from "@/components/research/ResearchComposer";
import { MissionCard } from "@/components/research/MissionCard";
import { Section } from "@/components/ui/Section";

const MISSIONS = [
  {
    tag: "Find a Build Opportunity",
    prompt: "Which lending protocol on Base has the biggest developer opportunity?",
  },
  {
    tag: "Find Market Gaps",
    prompt: "Find protocols with strong on-chain growth but weak web visibility.",
  },
  {
    tag: "Compare",
    prompt: "Compare the top lending protocols on Base by growth, users and competition.",
  },
  {
    tag: "Risk",
    prompt: "Which protocol shows the strongest growth quality right now?",
  },
];

export default function HomePage() {
  const [selectedPrompt, setSelectedPrompt] = useState("");

  return (
    <ScoutShell>
      <Section variant="editorial">
        <div className="max-w-scout mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-display text-5xl md:text-7xl lg:text-8xl space-y-1">
              <span className="block">What</span>
              <span className="block">Should</span>
              <span className="block">Scout</span>
              <span className="block text-signal">Find?</span>
            </h1>
            <p className="mt-8 text-lg text-ink/70">Ask a research question.</p>
            <div className="mt-8">
              <ResearchComposer initialPrompt={selectedPrompt} />
            </div>
          </div>
        </div>
      </Section>

      <Section variant="data">
        <div className="max-w-scout mx-auto px-4 md:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {MISSIONS.map((m) => (
              <MissionCard
                key={m.tag}
                tag={m.tag}
                prompt={m.prompt}
                onSelect={() => setSelectedPrompt(m.prompt)}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section variant="editorial">
        <div className="max-w-scout mx-auto px-4 md:px-8 text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 font-display text-xl md:text-2xl uppercase tracking-wide">
            {["Discover", "Compare", "Verify", "Decide"].map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
          <p className="max-w-xl mx-auto text-ink/70">
            Scout combines live on-chain activity, web intelligence and paid evidence
            to turn uncertain Web3 questions into defensible decisions.
          </p>
        </div>
      </Section>
    </ScoutShell>
  );
}
