import Link from "next/link";

/**
 * Sticky A-Z jump bar for the brand index. Letters with no brands are shown
 * but inert, so the row stays a stable ruler rather than reflowing per
 * catalogue.
 */
export function AlphabetJumpBar({
  letters,
  activeLetters,
}: {
  letters: string[];
  /** Letters that currently have at least one brand. */
  activeLetters: Set<string>;
}) {
  return (
    <nav
      aria-label="Jump to letter"
      className="sticky top-[72px] z-20 -mx-2 mt-8 flex flex-wrap gap-0.5 border-b border-border bg-background/95 px-2 py-3 backdrop-blur"
    >
      {letters.map((letter) => {
        const has = activeLetters.has(letter);
        return has ? (
          <Link
            key={letter}
            href={`#letter-${letter === "#" ? "num" : letter}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-medium text-ink transition-colors hover:bg-secondary"
          >
            {letter}
          </Link>
        ) : (
          <span
            key={letter}
            aria-hidden
            className="flex h-8 w-8 items-center justify-center text-[13px] text-faint/50"
          >
            {letter}
          </span>
        );
      })}
    </nav>
  );
}
