"use client";

import { useEffect, useState } from "react";
import { ScientistAvatar } from "@/components/ScientistAvatar";

type Status = "loading" | "ok" | "error";

/**
 * The home page's "AI tip" bubble — calls /api/ai-tip, which asks Gemini for
 * one short tip grounded in the signed-in user's routine (packages/core has
 * no runtime scoring role here; this is prose only, not a score or a safety
 * claim — see CLAUDE.md's deterministic-core rule).
 */
export function AiTipCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [tip, setTip] = useState("");
  const [error, setError] = useState("");

  async function fetchTip() {
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
  }

  useEffect(() => {
    void fetchTip();
  }, []);

  return (
    <div className="rounded-xl border border-soft-tan bg-ink p-5 text-warm-white">
      <div className="flex items-center gap-2">
        <ScientistAvatar talking={status === "loading"} size={22} />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-clay-strong">
          AI tip
        </span>
        <span className="text-[11px] text-white/50">today</span>
      </div>

      {status === "loading" && (
        <p className="mt-3 font-serif text-[19px] leading-[1.4] text-white/60">
          Thinking about your routine…
        </p>
      )}

      {status === "error" && (
        <>
          <p className="mt-3 text-[13px] leading-[1.55] text-white/65">{error}</p>
          <button
            type="button"
            onClick={() => void fetchTip()}
            className="mt-4 text-[13px] font-bold text-warm-white hover:underline"
          >
            Try again →
          </button>
        </>
      )}

      {status === "ok" && (
        <>
          <p className="mt-3 font-serif text-[19px] leading-[1.4] text-warm-white">{tip}</p>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => void fetchTip()}
              className="text-[13px] font-bold text-warm-white hover:underline"
            >
              Another tip →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
