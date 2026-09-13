"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecisionLogEntry, PaymentPending, ResearchSession } from "@scout/schemas";
import { ApiError, API_URL, fetchSession } from "../api";

function stopPolling(
  esRef: React.MutableRefObject<EventSource | null>,
  pollRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
) {
  esRef.current?.close();
  esRef.current = null;
  if (pollRef.current) {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }
}

// After this many consecutive failed refreshes (~10s at the 2s poll interval) a
// non-404 error (502s during a Render restart, a dropped connection, ...) is
// treated as "the server isn't answering" rather than retried forever.
const MAX_CONSECUTIVE_FAILURES = 5;

export function useResearchStream(researchId: string | null) {
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [paymentPending, setPaymentPending] = useState<PaymentPending | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failureCountRef = useRef(0);

  const retry = useCallback(() => {
    failureCountRef.current = 0;
    setRetryKey((k) => k + 1);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!researchId) return;
    try {
      const data = await fetchSession(researchId);
      failureCountRef.current = 0;
      setSession(data);
      if (data.status === "completed" || data.status === "failed") {
        setDone(true);
        setLoading(false);
      }
      if (data.status === "awaiting_payment") {
        setPaymentPending(data.paymentPending ?? null);
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // The session genuinely doesn't exist (e.g. an API restart cleared the
        // ephemeral store) — retrying forever every 2s just spams the network
        // and console. Stop for good instead of polling a dead session.
        setError("This research session no longer exists — it may have been cleared by a server restart. Start a new research run.");
        setNotFound(true);
        setLoading(false);
        setDone(true);
        stopPolling(esRef, pollRef);
        return;
      }

      failureCountRef.current += 1;
      if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
        // Not a clean 404 — e.g. repeated 502s while the API restarts — but it's
        // been failing for a while now. Stop hammering it instead of polling
        // and reconnecting the stream forever; let the visitor retry manually.
        setError("Can't reach the Scout API right now. It may be restarting — try again in a moment.");
        setUnreachable(true);
        setLoading(false);
        stopPolling(esRef, pollRef);
        return;
      }
      setError("Failed to load session");
    }
  }, [researchId]);

  useEffect(() => {
    if (!researchId) return;

    setLoading(true);
    setError(null);
    setDone(false);
    setNotFound(false);
    setUnreachable(false);
    setLogs([]);
    setPaymentPending(null);
    failureCountRef.current = 0;

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
      // The native EventSource will keep retrying this connection on its own.
      // Check the session directly so a confirmed-gone session (404) stops
      // both the poll loop and this stream immediately instead of retrying forever.
      refreshSession();
    };

    pollRef.current = setInterval(refreshSession, 2000);

    return () => {
      stopPolling(esRef, pollRef);
    };
  }, [researchId, refreshSession, retryKey]);

  return {
    logs,
    session,
    paymentPending,
    loading,
    error,
    done,
    notFound,
    unreachable,
    refreshSession,
    retry,
  };
}
