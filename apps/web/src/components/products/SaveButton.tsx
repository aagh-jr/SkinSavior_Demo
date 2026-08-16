"use client";

import { useState, useTransition } from "react";
import { toggleSavedAction } from "@/app/shelf/actions";

/**
 * Save a product to My shelf.
 *
 * Optimistic: the label flips immediately and reverts if the server rejects.
 * A save is trivially reversible, so making the user wait on a round trip for
 * feedback would be the wrong trade.
 */
export function SaveButton({
  productId,
  initialSaved,
  signedIn,
}: {
  productId: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) return null;

  const onClick = () => {
    const previous = saved;
    setSaved(!previous);
    setError(null);
    startTransition(async () => {
      try {
        const res = await toggleSavedAction(productId);
        if (!res.ok) {
          setSaved(previous);
          setError(res.error);
        } else {
          setSaved(res.saved);
        }
      } catch {
        setSaved(previous);
        setError("Something went wrong — refresh and try again.");
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        className={
          "inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[14px] font-semibold transition-colors disabled:opacity-60 " +
          (saved
            ? "border-clay bg-[#fdf1ec] text-clay"
            : "border-border bg-warm-white text-ink hover:border-clay")
        }
      >
        <span aria-hidden>{saved ? "★" : "☆"}</span>
        {saved ? "On your shelf" : "Save to shelf"}
      </button>
      {error && <p className="mt-1.5 text-[12px] text-[#9a4a2f]">{error}</p>}
    </div>
  );
}
