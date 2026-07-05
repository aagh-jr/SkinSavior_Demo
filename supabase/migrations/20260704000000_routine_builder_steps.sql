-- Personal routine builder: per-step scheduling + category override.
--
-- routine_steps predates the builder and only had step_order/product_id/note.
-- Adds the per-product controls the builder needs: AM/PM/Both, frequency
-- presets (+ custom days-of-week), and a canonical category used for the
-- auto-sort order. Category/frequency value lists must stay in sync with
-- apps/web/src/lib/routine-categories.ts.
--
-- ADDITIVE and idempotent. Safe to re-run. No RLS changes needed — the
-- existing owner-via-parent-routine policy covers new columns automatically.

alter table public.routine_steps
  add column if not exists time_of_day text not null default 'both';
alter table public.routine_steps
  add column if not exists frequency text not null default 'daily';
-- Days of week for frequency = 'custom'; 0 = Monday … 6 = Sunday.
alter table public.routine_steps
  add column if not exists custom_days smallint[] not null default '{}';
alter table public.routine_steps
  add column if not exists category text not null default 'other';

alter table public.routine_steps
  drop constraint if exists routine_steps_time_of_day_check;
alter table public.routine_steps
  add constraint routine_steps_time_of_day_check
  check (time_of_day in ('am', 'pm', 'both'));

alter table public.routine_steps
  drop constraint if exists routine_steps_frequency_check;
alter table public.routine_steps
  add constraint routine_steps_frequency_check
  check (frequency in ('daily', 'every_other_day', '2x_week', 'weekly', 'custom'));

alter table public.routine_steps
  drop constraint if exists routine_steps_category_check;
alter table public.routine_steps
  add constraint routine_steps_category_check
  check (category in (
    'oil_cleanser', 'cleanser', 'exfoliant', 'mask', 'toner', 'essence',
    'serum', 'eye_cream', 'spot_treatment', 'moisturizer', 'face_oil',
    'lip_balm', 'sunscreen', 'other'
  ));
