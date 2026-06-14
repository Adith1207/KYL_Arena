-- Database Migration: Authentication & User Profiles Setup
-- Date: 2026-06-09
-- Purpose: Support Google OAuth, Strava OAuth, and future account linking.

-- Create user profile database model
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  auth_provider TEXT,
  strava_connected BOOLEAN DEFAULT FALSE,
  strava_athlete_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for public safety
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profile access
-- 1. Profiles are readable by anyone (for community leaderboards)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- 2. Users can update their own profile details
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger Function: Auto-populate profile table on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  var_name TEXT;
  var_avatar TEXT;
  var_provider TEXT;
BEGIN
  -- Extract name and avatar details from OAuth provider metadata fields
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
    new.email,
    var_name,
    var_avatar,
    var_provider,
    -- If they directly onboarded via Strava, mark connected as true
    (var_provider = 'strava'),
    CASE WHEN var_provider = 'strava' THEN new.raw_user_meta_data->>'sub' ELSE NULL END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Bind handler function to run after auth.users insertions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
