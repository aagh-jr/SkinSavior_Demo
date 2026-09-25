/** Landing page footer. */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-14">
        <span className="font-serif text-lg font-semibold text-ink">skinsavior</span>
        <span className="text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} · Independent &amp; unbiased · Not medical advice.
        </span>
      </div>
    </footer>
  );
}
