-- Evidence Explainer: fixed badge vocabulary for claims.
--
-- Free-text claim_text let the Stage-1 extractor write the same benefit in
-- slightly different words per paper, producing near-duplicate claims
-- (bakuchiol accumulated 7 variants of ~3 benefits). A claim is now an
-- (ingredient, badge) pair drawn from the fixed vocabulary in
-- packages/core/src/research/claim-badges.ts; the consumer-facing card text
-- and chip label live in code next to the badge, not in the database.
--
-- claim_type stays as a column (the read layer filters prohibited rows in
-- SQL) but is now denormalized FROM the badge at write time — the LLM no
-- longer classifies it.
--
-- After applying, run scripts/regrade-claims.mjs: merging duplicates changes
-- each claim's study set, so certainty/study_count must be recomputed by the
-- grading service (still the only writer of those columns).

alter table public.claims add column if not exists badge_slug text;

-- Backfill: map every live claim_text onto its badge.
update public.claims c
set badge_slug = m.badge_slug
from (values
  ('Helps even out the look of uneven skin tone', 'evens-tone'),
  ('Helps even the look of skin tone and hyperpigmentation', 'evens-tone'),
  ('Helps even the look of skin tone and reduce visible pigmentation', 'evens-tone'),
  ('Helps soften the look of fine lines', 'smooths-wrinkles'),
  ('Helps improve the look of fine lines and wrinkles', 'smooths-wrinkles'),
  ('Helps reduce the look of wrinkles and photoaging', 'smooths-wrinkles'),
  ('Helps improve the look of aging skin', 'smooths-wrinkles'),
  ('Helps reduce the look of wrinkles and hyperpigmentation for smoother, more even-looking skin', 'smooths-wrinkles'),
  ('Supports the look of firmer, more elastic skin', 'firms'),
  ('Helps reduce the look of enlarged pores', 'minimizes-pores'),
  ('Supports the skin''s collagen and antioxidant defenses', 'supports-collagen')
) as m (claim_text, badge_slug)
where c.claim_text = m.claim_text
  and c.badge_slug is null;

-- Merge duplicates: keep one canonical row per (ingredient, badge), repoint
-- study links at it, then drop the rest (their claim_studies rows cascade).
with canon as (
  select id,
         first_value(id) over (
           partition by ingredient_id, badge_slug
           order by id
         ) as canonical_id
  from public.claims
  where badge_slug is not null
)
insert into public.claim_studies (claim_id, study_id)
select canon.canonical_id, cs.study_id
from public.claim_studies cs
join canon on canon.id = cs.claim_id
where canon.id <> canon.canonical_id
on conflict (claim_id, study_id) do nothing;

with canon as (
  select id,
         first_value(id) over (
           partition by ingredient_id, badge_slug
           order by id
         ) as canonical_id
  from public.claims
  where badge_slug is not null
)
delete from public.claims c
using canon
where c.id = canon.id
  and canon.id <> canon.canonical_id;

-- claim_type is derived from the badge (also fixes rows mistyped at data
-- entry, e.g. a cosmetic phrasing hand-typed as borderline).
update public.claims c
set claim_type = m.claim_type
from (values
  ('evens-tone', 'cosmetic'),
  ('brightens', 'cosmetic'),
  ('smooths-wrinkles', 'cosmetic'),
  ('firms', 'cosmetic'),
  ('hydrates', 'cosmetic'),
  ('smooths-texture', 'cosmetic'),
  ('minimizes-pores', 'cosmetic'),
  ('controls-oil', 'cosmetic'),
  ('reduces-redness', 'borderline'),
  ('soothes', 'borderline'),
  ('supports-barrier', 'borderline'),
  ('antioxidant', 'borderline'),
  ('supports-collagen', 'borderline'),
  ('studied-for-acne', 'prohibited'),
  ('studied-for-rosacea', 'prohibited'),
  ('studied-for-eczema', 'prohibited'),
  ('studied-for-other-condition', 'prohibited')
) as m (badge_slug, claim_type)
where c.badge_slug = m.badge_slug
  and c.claim_type is distinct from m.claim_type;

-- badge_slug becomes the natural key; claim_text goes away (card copy lives
-- in code, keyed by badge). The check mirrors claim-badges.ts — adding a
-- badge means extending both.
alter table public.claims alter column badge_slug set not null;

alter table public.claims drop constraint if exists claims_badge_slug_check;
alter table public.claims add constraint claims_badge_slug_check
  check (badge_slug in (
    'evens-tone', 'brightens', 'smooths-wrinkles', 'firms', 'hydrates',
    'smooths-texture', 'minimizes-pores', 'controls-oil',
    'reduces-redness', 'soothes', 'supports-barrier', 'antioxidant',
    'supports-collagen',
    'studied-for-acne', 'studied-for-rosacea', 'studied-for-eczema',
    'studied-for-other-condition'
  ));

-- Dropping the column also drops the old unique (ingredient_id, claim_text).
alter table public.claims drop column if exists claim_text;

alter table public.claims drop constraint if exists claims_ingredient_id_badge_slug_key;
alter table public.claims add constraint claims_ingredient_id_badge_slug_key
  unique (ingredient_id, badge_slug);
