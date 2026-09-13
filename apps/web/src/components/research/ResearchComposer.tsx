"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";

export function ResearchComposer({
  prompt,
  onPromptChange,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    router.push(`/research/new?prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <div className="space-y-6">
      <Textarea
        label="Ask a research question"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={4}
        placeholder="Analyze the most promising lending protocol on Base for a developer product…"
        className="text-lg min-h-[120px]"
      />
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!prompt.trim()}
        className="group gap-3"
      >
        <span>Run Research</span>
        <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
      </Button>
    </div>
  );
}
