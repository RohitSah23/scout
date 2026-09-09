"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startResearch } from "../api";

export function useStartResearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(params: {
    request: string;
    chain?: string;
    category?: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const { researchId } = await startResearch(params);
      router.push(`/research/${researchId}`);
    } catch {
      setError("Failed to start research mission.");
      setLoading(false);
    }
  }

  return { start, loading, error };
}
