-- Migration: Create activities table and add last_synced_at to profiles
-- Date: 2026-06-13
-- Purpose: Store user fitness activities synced from Strava, and track synchronization timing.

-- 1. Create public.activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  distance NUMERIC NOT NULL,
  moving_time INTEGER NOT NULL,
  elapsed_time INTEGER NOT NULL,
  sport_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date_local TIMESTAMP WITH TIME ZONE,
  average_speed NUMERIC,
  total_elevation_gain NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add last_synced_at to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- 3. Enable Row Level Security (RLS) on public.activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for public.activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities" 
  ON public.activities FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
CREATE POLICY "Users can insert their own activities" 
  ON public.activities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
CREATE POLICY "Users can update their own activities" 
  ON public.activities FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities" 
  ON public.activities FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Grant permissions to postgres and service_role for background tasks
GRANT ALL ON public.activities TO postgres;
GRANT ALL ON public.activities TO service_role;
