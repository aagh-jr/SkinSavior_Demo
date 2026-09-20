/** Grid/list view toggle button; `children` are the inline SVG path/rects. */
export function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={
        "flex h-7 w-8 items-center justify-center rounded-[7px] transition-colors " +
        (active ? "bg-secondary text-link" : "text-faint hover:text-ink")
      }
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        {children}
      </svg>
    </button>
  );
}
