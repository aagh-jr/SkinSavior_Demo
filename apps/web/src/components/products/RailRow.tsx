/** One row in the products filter rail (a toggleable type filter). */
export function RailRow({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-between gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors " +
        (active
          ? "border-clay bg-secondary"
          : "border-soft-tan bg-warm-white hover:border-clay hover:bg-secondary/60")
      }
    >
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </button>
  );
}
