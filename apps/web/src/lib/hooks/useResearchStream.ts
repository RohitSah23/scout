"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecisionLogEntry, PaymentPending, ResearchSession } from "@scout/schemas";
import { API_URL, fetchSession } from "../api";

export function useResearchStream(researchId: string | null) {
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [paymentPending, setPaymentPending] = useState<PaymentPending | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSession = useCallback(async () => {
    if (!researchId) return;
    try {
      const data = await fetchSession(researchId);
      setSession(data);
      if (data.status === "completed" || data.status === "failed") {
        setDone(true);
        setLoading(false);
      }
      if (data.status === "awaiting_payment") {
        setPaymentPending(data.paymentPending ?? null);
        setLoading(false);
      }
    } catch {
      setError("Failed to load session");
    }
  }, [researchId]);

  useEffect(() => {
    if (!researchId) return;

    setLoading(true);
    setError(null);
    setDone(false);
    setLogs([]);
    setPaymentPending(null);

    refreshSession();

    esRef.current?.close();
    const es = new EventSource(`${API_URL}/research/${researchId}/stream`);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const entry = JSON.parse(ev.data) as DecisionLogEntry;
        setLogs((prev) => {
          const exists = prev.some(
            (p) => p.timestamp === entry.timestamp && p.message === entry.message,
          );
          return exists ? prev : [...prev, entry];
        });
      } catch {
        /* ignore */
      }
    };

    const handleEntry = (ev: MessageEvent) => {
      try {
        const entry = JSON.parse(ev.data) as DecisionLogEntry;
        setLogs((prev) => {
          const exists = prev.some(
            (p) => p.timestamp === entry.timestamp && p.message === entry.message,
          );
          return exists ? prev : [...prev, entry];
        });
      } catch {
        /* ignore */
      }
    };

    es.addEventListener("message", handleEntry);
    const eventTypes = [
      "mission.received", "plan.created", "graph.discovery", "graph.query",
      "graph.complete", "openseo.started", "openseo.complete", "candidates.updated",
      "scores.provisional", "uncertainty.detected", "payment.required", "payment.pending",
      "payment.settled", "deep_analysis.received", "recommendation.generated",
      "ens.updated", "research.completed", "research.failed",
    ];
    for (const type of eventTypes) {
      es.addEventListener(type, handleEntry);
    }

    es.addEventListener("awaiting_payment", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setPaymentPending(data.paymentPending ?? null);
        setLoading(false);
        refreshSession();
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("done", async () => {
      setLoading(false);
      setDone(true);
      await refreshSession();
      es.close();
      if (pollRef.current) clearInterval(pollRef.current);
    });

    es.onerror = () => {
      setError("Connection lost. Polling for updates.");
    };

    pollRef.current = setInterval(refreshSession, 2000);

    return () => {
      es.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [researchId, refreshSession]);

  return {
    logs,
    session,
    paymentPending,
    loading,
    error,
    done,
    refreshSession,
  };
}
