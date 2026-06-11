-- Migration: Create strava_connections table
-- Date: 2026-06-11
-- Purpose: Store OAuth credentials and athlete metadata for Strava integrations.

CREATE TABLE IF NOT EXISTS public.strava_connections (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  strava_athlete_id TEXT UNIQUE NOT NULL,
  athlete_name TEXT,
  athlete_username TEXT,
  athlete_avatar TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- A user can read, insert, update, or delete their own connection details.
CREATE POLICY "Users can view their own Strava connections" 
  ON public.strava_connections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Strava connections" 
  ON public.strava_connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Strava connections" 
  ON public.strava_connections FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Strava connections" 
  ON public.strava_connections FOR DELETE 
  USING (auth.uid() = user_id);
