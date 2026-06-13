-- Migration: Backfill public.profiles and enhance handle_new_user trigger function
-- Date: 2026-06-13
-- Purpose: Ensure every existing auth.users record has a matching public.profiles row, and prevent future failures.

-- 1. Enhance the trigger function to be robust against missing emails and conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  var_name TEXT;
  var_avatar TEXT;
  var_provider TEXT;
BEGIN
  -- Extract name and avatar details from raw_user_meta_data
  var_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    'Athlete'
  );
  
  var_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  -- Determine initial auth provider
  var_provider := COALESCE(
    new.raw_app_meta_data->>'provider',
    'google'
  );

  -- Insert profile linking to the authenticated user ID
  -- Safe guard with COALESCE for non-null email and ON CONFLICT DO NOTHING
  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar,
    auth_provider,
    strava_connected,
    strava_athlete_id
  ) VALUES (
    new.id,
    COALESCE(new.email, ''),
    var_name,
    var_avatar,
    var_provider,
    (var_provider = 'strava'),
    CASE WHEN var_provider = 'strava' THEN new.raw_user_meta_data->>'sub' ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make sure the trigger is correctly bound to auth.users (drop if exists and recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Run the backfill query to insert missing profiles for existing users
INSERT INTO public.profiles (
  id,
  email,
  name,
  avatar,
  auth_provider,
  strava_connected,
  strava_athlete_id
)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    'Athlete'
  ) AS name,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    ''
  ) AS avatar,
  COALESCE(
    u.raw_app_meta_data->>'provider',
    'google'
  ) AS auth_provider,
  (COALESCE(u.raw_app_meta_data->>'provider', '') = 'strava') AS strava_connected,
  CASE WHEN COALESCE(u.raw_app_meta_data->>'provider', '') = 'strava' THEN u.raw_user_meta_data->>'sub' ELSE NULL END AS strava_athlete_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
