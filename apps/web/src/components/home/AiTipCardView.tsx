import { ScientistAvatar } from "@/components/ScientistAvatar";
import type { AiTipStatus } from "@/hooks/useAiTip";

/**
 * Presentational AI tip bubble for the home page. Receives its state via props
 * (see useAiTip); renders nothing that fetches. The tip is Gemini prose only —
 * never a score or a safety claim (CLAUDE.md's deterministic-core rule).
 */
export function AiTipCardView({
  status,
  tip,
  error,
  onRefresh,
}: {
  status: AiTipStatus;
  tip: string;
  error: string;
  onRefresh: () => void;
}) {
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
            onClick={onRefresh}
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
              onClick={onRefresh}
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
