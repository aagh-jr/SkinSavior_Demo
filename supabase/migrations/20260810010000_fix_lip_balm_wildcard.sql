-- Fix false lip_balm matches in canonical_category.
--
-- The previous expression used LIKE '%lip_%', but in SQL LIKE the underscore
-- is a SINGLE-CHARACTER WILDCARD, not a literal. So it matched "lip" followed
-- by any character and swept in products that merely contain the letters:
--
--   SkinCeuticals Triple Lipid Restore 2:4:2   ("Lipid")     -> moisturizer
--   Sence Sweet Lollipop Face Sheet Mask       ("Lollipop")  -> mask
--
-- Replaced with a POSIX regex requiring a word boundary on both sides, so
-- "Lip Sleeping Mask" still matches while "Lipid" and "Lollipop" do not.
-- (~* is IMMUTABLE, so it is valid inside a generated column.)
--
-- A generated column's expression can't be altered in place, so the column is
-- dropped and re-added. Nothing is lost: every value is derived from
-- `category` and `name`, both untouched.

drop index if exists products_canonical_category_idx;
alter table public.products drop column if exists canonical_category;

alter table public.products
  add column canonical_category text
  generated always as (
    case
      -- "lip" as a whole word only.
      when coalesce(name, '') ~* '(^|[^[:alpha:]])lip([^[:alpha:]]|$)'
        then 'lip_balm'

      when lower(coalesce(category, '')) in ('sunscreen', 'sunscreens', 'spf')
        then 'sunscreen'
      when lower(coalesce(category, '')) in ('cleanser', 'cleansers')
        then 'cleanser'
      when lower(coalesce(category, '')) in ('oil cleanser', 'cleansing oil', 'cleansing balm')
        then 'oil_cleanser'
      when lower(coalesce(category, '')) in
           ('moisturizer', 'moisturizers', 'face-creams', 'face creams', 'cream', 'balm')
        then 'moisturizer'
      when lower(coalesce(category, '')) in ('serum', 'serums')
        then 'serum'
      when lower(coalesce(category, '')) in ('essence', 'essences', 'ampoule', 'ampoules')
        then 'essence'
      when lower(coalesce(category, '')) in ('toner', 'toners')
        then 'toner'
      when lower(coalesce(category, '')) in ('exfoliant', 'exfoliants', 'peeling', 'peel')
        then 'exfoliant'
      when lower(coalesce(category, '')) in ('mask', 'masks', 'face-masks', 'face masks')
        then 'mask'
      when lower(coalesce(category, '')) in ('eye cream', 'eye-cream', 'eye creams')
        then 'eye_cream'
      when lower(coalesce(category, '')) in ('treatment', 'treatments', 'spot treatment')
        then 'spot_treatment'
      when lower(coalesce(category, '')) in ('oil', 'oils', 'face oil')
        then 'face_oil'
      else 'other'
    end
  ) stored;

comment on column public.products.canonical_category is
  'Normalized category from the ROUTINE_CATEGORIES vocabulary. Generated from
   `category` (plus a whole-word lip check), so it cannot drift. `category`
   keeps the original source value.';

create index if not exists products_canonical_category_idx
  on public.products (canonical_category);
