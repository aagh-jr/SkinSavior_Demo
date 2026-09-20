"use client";

import { useCallback, useEffect, useState } from "react";

export type AiTipStatus = "loading" | "ok" | "error";

export interface AiTipState {
  status: AiTipStatus;
  tip: string;
  error: string;
  /** Re-request a tip (used by the "Another tip" / "Try again" buttons). */
  refresh: () => void;
}

/**
 * Data hook for the home page's AI tip. Calls /api/ai-tip (Gemini prose only —
 * never a score or safety claim), owning all loading/error state so the card
 * component can stay presentational.
 */
export function useAiTip(): AiTipState {
  const [status, setStatus] = useState<AiTipStatus>("loading");
  const [tip, setTip] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/ai-tip", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't load a tip right now.");
        setStatus("error");
        return;
      }
      setTip(body.tip);
      setStatus("ok");
    } catch {
      setError("Couldn't reach the AI right now.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const refresh = useCallback(() => {
    void run();
  }, [run]);

  return { status, tip, error, refresh };
}
