/** Dashed-border placeholder shown when a shelf section has nothing in it. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[14px] border border-dashed border-[#d8ccba] bg-warm-white p-6 text-[14px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
