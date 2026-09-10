import Image from "next/image";
import { CategoryIcon } from "@/components/CategoryIcon";
import { categoryToCanonical } from "@/lib/category-icon-map";
import { highResImageUrl } from "@/lib/product-image";

// Product image, with the category's line icon as the fallback when we have no
// photo for a product.
interface ProductThumbProps {
  category?: string | null;
  imageUrl?: string | null;
  name?: string;
  /** Extra classes for the container (aspect ratio, rounding, etc.). */
  className?: string;
  /** Icon size in px for the no-photo fallback. */
  iconSize?: number;
  /** Rendered width hint for next/image. Larger for hero images. */
  sizes?: string;
  /**
   * Classes for the <Image> itself — object-fit and padding. Defaults to a
   * contained photo with a small inset. Pass `"object-contain"` (no padding)
   * to let the photo bleed to the container edges.
   */
  imageClassName?: string;
}

export function ProductThumb({
  category,
  imageUrl,
  name,
  className = "",
  iconSize = 44,
  sizes = "(max-width: 768px) 40vw, 380px",
  imageClassName = "object-contain p-1.5",
}: ProductThumbProps) {
  const src = highResImageUrl(imageUrl);

  if (src) {
    return (
      // `bg-white` matters: product shots are cut out on white, and letterboxing
      // them against the warm page background looks like a rendering fault.
      <div className={`relative overflow-hidden bg-white ${className}`}>
        <Image
          src={src}
          alt={name ?? "Product image"}
          fill
          sizes={sizes}
          // `contain`, not `cover`. Catalog photography is mostly tall bottles
          // and tubes; cropping them to a square cut the tops and bottoms off
          // the product — the single most visible data-quality complaint.
          className={imageClassName}
          // Sources are third-party and occasionally 404 or hotlink-block.
          // Without this the alt text renders as a broken-image glyph.
          unoptimized={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-cream text-faint ${className}`}
    >
      <CategoryIcon category={categoryToCanonical(category)} size={iconSize} />
    </div>
  );
}
