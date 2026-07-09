"use client";

import { useEffect, useState } from "react";

/**
 * The app's pixel-art scientist mascot. Sits next to AI-driven surfaces and
 * "speaks" while the model is working: when `talking` is true the avatar
 * cycles between the closed-mouth and open-mouth frames; otherwise it rests
 * on the closed-mouth frame.
 *
 * Both frames are pre-rendered stacked so the first swap never flickers on a
 * cold image cache.
 */
export function ScientistAvatar({
  talking,
  size = 48,
  className = "",
}: {
  talking: boolean;
  /** Rendered box size in px (the frames are square-ish pixel art). */
  size?: number;
  className?: string;
}) {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (!talking) {
      setMouthOpen(false);
      return;
    }
    const id = setInterval(() => setMouthOpen((m) => !m), 350);
    return () => clearInterval(id);
  }, [talking]);

  return (
    <span
      className={
        "relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white " +
        className
      }
      style={{ width: size, height: size }}
      role="img"
      aria-label={talking ? "Scientist talking" : "Scientist"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scientist.png"
        alt=""
        className={mouthOpen ? "invisible" : "visible"}
        style={{ width: "82%", height: "82%", objectFit: "contain", imageRendering: "pixelated" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scientist-talking.png"
        alt=""
        className={"absolute " + (mouthOpen ? "visible" : "invisible")}
        style={{ width: "82%", height: "82%", objectFit: "contain", imageRendering: "pixelated" }}
      />
    </span>
  );
}
