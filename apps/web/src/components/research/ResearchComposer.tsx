"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ResearchComposer({ initialPrompt = "" }: { initialPrompt?: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  function handleSubmit() {
    if (!prompt.trim()) return;
    router.push(`/research/new?prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <div className="space-y-6">
      <Textarea
        label="Ask a research question"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="Analyze the most promising lending protocol on Base for a developer product…"
        className="text-lg min-h-[120px]"
      />
      <Button onClick={handleSubmit} disabled={!prompt.trim()}>
        Run Research →
      </Button>
    </div>
  );
}
