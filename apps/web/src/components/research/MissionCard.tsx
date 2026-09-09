"use client";

import { Card } from "@/components/ui/Card";

export function MissionCard({
  tag,
  prompt,
  onSelect,
}: {
  tag: string;
  prompt: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="text-left w-full group">
      <Card className="h-full transition-all group-hover:shadow-brutal group-hover:-translate-y-0.5">
        <p className="font-display text-xs uppercase tracking-widest text-signal mb-3">{tag}</p>
        <p className="text-sm leading-relaxed text-ink/80">&ldquo;{prompt}&rdquo;</p>
      </Card>
    </button>
  );
}
