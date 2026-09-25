/** Success screen shown after quiz answers are saved. */
export function DoneView({ isRetake }: { isRetake: boolean }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-2xl text-sage">
        ✓
      </div>
      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
        Your skin profile is saved.
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        {isRetake
          ? "Your match scores are updated across the site. Back to settings…"
          : "Next: your routine. We've started it with the steps you told us you already use — add the products you own so we can check them for clashes."}
      </p>
    </div>
  );
}
