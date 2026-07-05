import { CategoryIcon } from "@/components/CategoryIcon";
import { categoryToCanonical } from "@/lib/category-icon-map";

// TEMPORARY: product image placeholder. Until real product photography lands,
// we show the category's line icon (a cleanser gets the cleanser icon, etc.)
// on a soft tinted panel. If a real `imageUrl` exists, that wins.
interface ProductThumbProps {
  category?: string | null;
  imageUrl?: string | null;
  name?: string;
  /** Extra classes for the container (aspect ratio, rounding, etc.). */
  className?: string;
  /** Icon size in px. */
  iconSize?: number;
}

export function ProductThumb({
  category,
  imageUrl,
  name,
  className = "",
  iconSize = 44,
}: ProductThumbProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name ?? "Product image"}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-[#efe7d9] text-[#b07a4f] ${className}`}
    >
      <CategoryIcon category={categoryToCanonical(category)} size={iconSize} />
    </div>
  );
}
