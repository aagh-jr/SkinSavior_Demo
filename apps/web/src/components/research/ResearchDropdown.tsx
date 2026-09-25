import type { ResearchIngredient } from "@skinsavior/core/types";
import type { Paper } from "@skinsavior/core/research";
import { ProductResearch } from "./ProductResearch";
import { ResearchPaperList } from "./IngredientResearch";

/**
 * Research reading list for the shipping product profile. The section remains
 * visible; each paper owns its own disclosure in IngredientResearch so people
 * can inspect one abstract without expanding the entire bibliography.
 */
export function ResearchDropdown({
  ingredients,
  papers,
}: {
  ingredients: ResearchIngredient[];
  /** Preloaded source list for a static design fixture; regular products fetch lazily. */
  papers?: Paper[];
}) {
  if (!ingredients.length) return null;

  return (
    <section id="research" className="scroll-mt-28" aria-labelledby="research-heading">
      <h2
        id="research-heading"
        className="m-0 font-mono text-[14px] font-bold uppercase tracking-[0.07em] text-ink"
      >
        The research
      </h2>
      <p className="mt-1 text-[13px] leading-5 text-faint">
        Top PubMed papers{ingredients.length > 1 ? " — pick an ingredient" : ""}. Expand a paper for
        its abstract and source link.
      </p>
      <div className="mt-4">
        {papers ? <ResearchPaperList papers={papers} /> : <ProductResearch ingredients={ingredients} />}
      </div>
    </section>
  );
}
