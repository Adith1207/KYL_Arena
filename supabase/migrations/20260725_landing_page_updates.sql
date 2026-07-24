-- Migration: Landing Page Updates
-- Date: 2026-07-25
-- Purpose: Add contact_messages table and RPCs for live landing page stats

-- 1. Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and allow anyone to insert (public contact form)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- 2. RPC to get community stats fast
CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profiles_count int;
  v_challenges_count int;
  v_activities_count int;
  v_total_distance numeric;
  v_total_elevation numeric;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_challenges_count FROM public.challenges;
  SELECT COUNT(*) INTO v_activities_count FROM public.activities;
  -- Strava distance is in meters, divide by 1000 for KM
  SELECT COALESCE(SUM(distance) / 1000.0, 0) INTO v_total_distance FROM public.activities;
  SELECT COALESCE(SUM(total_elevation_gain), 0) INTO v_total_elevation FROM public.activities;

  RETURN jsonb_build_object(
    'profiles', v_profiles_count,
    'challenges', v_challenges_count,
    'activities', v_activities_count,
    'distance', v_total_distance,
    'elevation', v_total_elevation
  );
END;
$$;

-- 3. RPC to get leaderboard for live preview
CREATE OR REPLACE FUNCTION public.get_live_leaderboard(p_sport_type text)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  name text,
  avatar text,
  value numeric,
  percentage numeric,
  completed boolean,
  challenge_title text,
  challenge_goal_target numeric,
  challenge_goal_metric text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_db_sport_type text;
  v_challenge_id uuid;
  v_goal_target numeric;
  v_goal_metric text;
  v_start_date date;
  v_end_date date;
  v_title text;
BEGIN
  -- map frontend sport type to DB sport type
  IF p_sport_type = 'cycling' THEN
    v_db_sport_type := 'Ride';
  ELSIF p_sport_type = 'running' THEN
    v_db_sport_type := 'Run';
  ELSIF p_sport_type = 'walking' THEN
    v_db_sport_type := 'Walk';
  ELSE
    v_db_sport_type := p_sport_type;
  END IF;

  SELECT id, goal_target, goal_metric, start_date, end_date, title
  INTO v_challenge_id, v_goal_target, v_goal_metric, v_start_date, v_end_date, v_title
  FROM public.challenges
  WHERE sport_type = v_db_sport_type AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_challenge_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH participant_stats AS (
    SELECT
      cp.user_id,
      p.name,
      p.avatar,
      COALESCE(
        SUM(
          CASE 
            WHEN v_goal_metric = 'Distance' THEN a.distance / 1000.0
            WHEN v_goal_metric = 'Elevation' THEN a.total_elevation_gain
            ELSE a.distance / 1000.0
          END
        ),
        0
      ) as total_value
    FROM public.challenge_participants cp
    JOIN public.profiles p ON p.id = cp.user_id
    LEFT JOIN public.activities a 
      ON a.user_id = cp.user_id 
      AND a.sport_type = v_db_sport_type
      AND a.start_date >= v_start_date::timestamp with time zone
      AND a.start_date <= (v_end_date + interval '1 day')::timestamp with time zone
    WHERE cp.challenge_id = v_challenge_id
    GROUP BY cp.user_id, p.name, p.avatar
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY total_value DESC) as rank,
    ps.user_id,
    COALESCE(ps.name, 'Athlete') as name,
    ps.avatar,
    ps.total_value as value,
    LEAST((ps.total_value / NULLIF(v_goal_target, 0)) * 100, 100)::numeric as percentage,
    (ps.total_value >= v_goal_target) as completed,
    v_title,
    v_goal_target,
    v_goal_metric
  FROM participant_stats ps
  ORDER BY total_value DESC
  LIMIT 5;
END;
$$;
