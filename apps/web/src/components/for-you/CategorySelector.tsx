import Link from "next/link";

/** Server-rendered category chips for /for-you (links, so no client JS needed). */
export function CategorySelector({
  categories,
  active,
}: {
  categories: readonly { key: string; label: string }[];
  active: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {categories.map((c) => {
        const isActive = c.key === active;
        return (
          <Link
            key={c.key}
            href={`/for-you?category=${c.key}`}
            scroll={false}
            className={
              "rounded-full border px-4 py-2 text-[14px] font-medium transition-colors " +
              (isActive
                ? "border-ink bg-ink text-warm-white"
                : "border-border bg-warm-white text-ink hover:border-clay")
            }
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
