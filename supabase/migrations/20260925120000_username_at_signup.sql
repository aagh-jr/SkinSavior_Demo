-- Signup now asks for a username (apps/web/src/lib/username.ts) and passes it
-- in raw_user_meta_data. Copy it onto the new profile.
--
-- The client checks availability first, but two signups can race for the same
-- name. A unique_violation here would abort the auth.users insert and the
-- person would see "Database error saving new user" with no account at all —
-- so on a clash (or a malformed name) the profile is created WITHOUT a
-- username instead, and they can pick one in /settings.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );
  v_username TEXT := lower(NEW.raw_user_meta_data ->> 'username');
BEGIN
  -- Same rule as USERNAME_PATTERN in apps/web/src/lib/username.ts.
  IF v_username IS NOT NULL AND v_username !~ '^[a-z0-9_]{3,20}$' THEN
    v_username := NULL;
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, display_name, username)
    VALUES (NEW.id, v_display_name, v_username)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, v_display_name)
    ON CONFLICT (id) DO NOTHING;
  END;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
