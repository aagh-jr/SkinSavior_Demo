"use client";

import { useAiTip } from "@/hooks/useAiTip";
import { AiTipCardView } from "@/components/home/AiTipCardView";

/**
 * The home page's "AI tip" bubble. Thin wrapper: useAiTip owns the /api/ai-tip
 * request and all state; AiTipCardView renders it.
 */
export function AiTipCard() {
  const { status, tip, error, refresh } = useAiTip();
  return <AiTipCardView status={status} tip={tip} error={error} onRefresh={refresh} />;
}
