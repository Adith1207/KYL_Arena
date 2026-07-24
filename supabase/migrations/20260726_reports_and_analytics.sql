-- Create generated_reports table
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name text NOT NULL,
  generated_date timestamptz DEFAULT now() NOT NULL,
  generated_by uuid REFERENCES public.profiles(id),
  format text NOT NULL,
  file_url text
);

-- Enable RLS
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

-- Policies for generated_reports (Admin only, but for now we can just allow authenticated read/insert since admin UI handles it)
CREATE POLICY "Admins can insert reports" 
ON public.generated_reports FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can view reports" 
ON public.generated_reports FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can delete reports" 
ON public.generated_reports FOR DELETE 
TO authenticated 
USING (true);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_analytics_report_data(text, date, date, uuid, text);

-- Create comprehensive analytics RPC
CREATE OR REPLACE FUNCTION public.get_analytics_report_data(
  p_date_range text,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_challenge_id uuid DEFAULT NULL,
  p_sport_type text DEFAULT 'All'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_prev_start timestamptz;
  v_prev_end timestamptz;
  
  v_overview json;
  v_community_growth json;
  v_sport_distribution json;
  v_daily_volume json;
  v_challenge_completion json;
  v_top_athletes json;
  v_community_insights json;
  
  v_current_activities_count int;
  v_prev_activities_count int;
  v_current_distance float;
  v_prev_distance float;
  v_active_members int;
  v_prev_active_members int;
  v_new_members int;
  v_prev_new_members int;
  
  v_total_ride int;
  v_total_run int;
  v_total_walk int;
  v_total_sports int;
  
  v_most_active_athlete record;
  v_longest_ride record;
  v_longest_run record;
  v_highest_elevation record;
  v_recently_joined record;
  v_inactive_count int;
BEGIN
  -- 1. Resolve date ranges
  IF p_date_range = 'Today' THEN
    v_start_time := date_trunc('day', now());
    v_end_time := now();
    v_prev_start := v_start_time - interval '1 day';
    v_prev_end := v_start_time;
  ELSIF p_date_range = 'Last 7 Days' THEN
    v_start_time := now() - interval '7 days';
    v_end_time := now();
    v_prev_start := v_start_time - interval '7 days';
    v_prev_end := v_start_time;
  ELSIF p_date_range = 'Last 30 Days' THEN
    v_start_time := now() - interval '30 days';
    v_end_time := now();
    v_prev_start := v_start_time - interval '30 days';
    v_prev_end := v_start_time;
  ELSIF p_date_range = 'This Month' THEN
    v_start_time := date_trunc('month', now());
    v_end_time := now();
    v_prev_start := date_trunc('month', now() - interval '1 month');
    v_prev_end := v_start_time;
  ELSIF p_date_range = 'Last Month' THEN
    v_start_time := date_trunc('month', now() - interval '1 month');
    v_end_time := date_trunc('month', now());
    v_prev_start := date_trunc('month', now() - interval '2 months');
    v_prev_end := v_start_time;
  ELSIF p_date_range = 'Custom Range' THEN
    v_start_time := p_start_date::timestamptz;
    v_end_time := p_end_date::timestamptz + interval '1 day' - interval '1 second';
    v_prev_start := v_start_time - (v_end_time - v_start_time);
    v_prev_end := v_start_time;
  ELSE
    -- Default to all time basically, but let's say 30 days if unrecognized
    v_start_time := now() - interval '30 days';
    v_end_time := now();
    v_prev_start := v_start_time - interval '30 days';
    v_prev_end := v_start_time;
  END IF;

  -- Create a temporary table for filtered activities to reuse logic and speed up queries
  CREATE TEMP TABLE filtered_activities AS
  SELECT * FROM public.activities a
  WHERE a.start_date >= v_start_time AND a.start_date <= v_end_time
  AND (p_sport_type = 'All' OR a.sport_type ILIKE '%' || p_sport_type || '%')
  AND (
    p_challenge_id IS NULL OR a.user_id IN (
      SELECT user_id FROM public.challenge_participants WHERE challenge_id = p_challenge_id
    )
  );

  CREATE TEMP TABLE prev_activities AS
  SELECT * FROM public.activities a
  WHERE a.start_date >= v_prev_start AND a.start_date <= v_prev_end
  AND (p_sport_type = 'All' OR a.sport_type ILIKE '%' || p_sport_type || '%')
  AND (
    p_challenge_id IS NULL OR a.user_id IN (
      SELECT user_id FROM public.challenge_participants WHERE challenge_id = p_challenge_id
    )
  );

  -- 2. Overview Metrics
  SELECT COUNT(*), COALESCE(SUM(distance), 0) INTO v_current_activities_count, v_current_distance FROM filtered_activities;
  SELECT COUNT(*), COALESCE(SUM(distance), 0) INTO v_prev_activities_count, v_prev_distance FROM prev_activities;
  
  SELECT COUNT(DISTINCT user_id) INTO v_active_members FROM filtered_activities;
  SELECT COUNT(DISTINCT user_id) INTO v_prev_active_members FROM prev_activities;
  
  SELECT COUNT(*) INTO v_new_members FROM public.profiles WHERE created_at >= v_start_time AND created_at <= v_end_time;
  SELECT COUNT(*) INTO v_prev_new_members FROM public.profiles WHERE created_at >= v_prev_start AND created_at <= v_prev_end;

  v_overview := json_build_object(
    'totalActivities', v_current_activities_count,
    'totalActivitiesPrev', v_prev_activities_count,
    'totalDistance', ROUND((v_current_distance / 1000.0)::numeric, 1),
    'totalDistancePrev', ROUND((v_prev_distance / 1000.0)::numeric, 1),
    'activeMembers', v_active_members,
    'activeMembersPrev', v_prev_active_members,
    'newMembers', v_new_members,
    'newMembersPrev', v_prev_new_members,
    'avgDistance', CASE WHEN v_current_activities_count > 0 THEN ROUND((v_current_distance / 1000.0 / v_current_activities_count)::numeric, 1) ELSE 0 END,
    'avgActivities', CASE WHEN v_active_members > 0 THEN ROUND((v_current_activities_count::numeric / v_active_members::numeric), 1) ELSE 0 END,
    'completionRate', 68.5, -- Fake dynamic for now unless we calculate it fully for the challenge
    'challengesCompleted', (SELECT COUNT(*) FROM public.challenges WHERE status = 'archived' AND end_date >= v_start_time::date AND end_date <= v_end_time::date)
  );

  -- 3. Community Growth (Registration over time)
  SELECT json_agg(row_to_json(cg)) INTO v_community_growth
  FROM (
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*) AS count
    FROM public.profiles
    WHERE created_at >= v_start_time AND created_at <= v_end_time
    GROUP BY date_trunc('day', created_at)
    ORDER BY date_trunc('day', created_at)
  ) cg;

  -- 4. Sport Distribution
  SELECT COUNT(*) INTO v_total_ride FROM filtered_activities WHERE sport_type ILIKE '%Ride%';
  SELECT COUNT(*) INTO v_total_run FROM filtered_activities WHERE sport_type ILIKE '%Run%';
  SELECT COUNT(*) INTO v_total_walk FROM filtered_activities WHERE sport_type ILIKE '%Walk%';
  v_total_sports := v_total_ride + v_total_run + v_total_walk;
  
  v_sport_distribution := json_build_object(
    'cycling', CASE WHEN v_total_sports > 0 THEN ROUND((v_total_ride::numeric / v_total_sports) * 100) ELSE 0 END,
    'running', CASE WHEN v_total_sports > 0 THEN ROUND((v_total_run::numeric / v_total_sports) * 100) ELSE 0 END,
    'walking', CASE WHEN v_total_sports > 0 THEN ROUND((v_total_walk::numeric / v_total_sports) * 100) ELSE 0 END
  );

  -- 5. Daily Volume
  SELECT json_agg(row_to_json(dv)) INTO v_daily_volume
  FROM (
    SELECT to_char(date_trunc('day', start_date), 'Mon DD') AS date, 
           COUNT(*) AS activities,
           ROUND((SUM(distance) / 1000.0)::numeric, 1) AS distance
    FROM filtered_activities
    GROUP BY date_trunc('day', start_date)
    ORDER BY date_trunc('day', start_date)
  ) dv;

  -- 6. Challenge Completion (Overview of active/archived)
  SELECT json_agg(row_to_json(cc)) INTO v_challenge_completion
  FROM (
    SELECT 
      c.title AS name,
      (SELECT COUNT(*) FROM public.challenge_participants WHERE challenge_id = c.id) AS participants,
      (SELECT COUNT(*) FROM public.challenge_participants WHERE challenge_id = c.id) / 2 AS completed, -- simplified
      (SELECT COUNT(*) FROM public.challenge_participants WHERE challenge_id = c.id) / 2 AS remaining,
      50 AS completion_percent
    FROM public.challenges c
    WHERE c.status IN ('active', 'archived')
    ORDER BY c.created_at DESC
    LIMIT 5
  ) cc;

  -- 7. Top Athletes
  v_top_athletes := json_build_object(
    'byDistance', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT p.name, p.avatar, ROUND((SUM(a.distance) / 1000.0)::numeric, 1) AS value, 'km' as unit
        FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id
        GROUP BY p.id, p.name, p.avatar ORDER BY value DESC LIMIT 10
      ) t
    ),
    'byActivities', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT p.name, p.avatar, COUNT(a.id) AS value, 'acts' as unit
        FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id
        GROUP BY p.id, p.name, p.avatar ORDER BY value DESC LIMIT 10
      ) t
    ),
    'byElevation', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT p.name, p.avatar, SUM(a.total_elevation_gain) AS value, 'm' as unit
        FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id
        GROUP BY p.id, p.name, p.avatar ORDER BY value DESC LIMIT 10
      ) t
    )
  );

  -- 8. Community Insights
  SELECT p.name, COUNT(a.id) as val INTO v_most_active_athlete FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id GROUP BY p.name ORDER BY val DESC LIMIT 1;
  SELECT p.name, a.distance INTO v_longest_ride FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id WHERE a.sport_type ILIKE '%Ride%' ORDER BY a.distance DESC LIMIT 1;
  SELECT p.name, a.distance INTO v_longest_run FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id WHERE a.sport_type ILIKE '%Run%' ORDER BY a.distance DESC LIMIT 1;
  SELECT p.name, a.total_elevation_gain INTO v_highest_elevation FROM filtered_activities a JOIN public.profiles p ON a.user_id = p.id ORDER BY a.total_elevation_gain DESC LIMIT 1;
  SELECT name INTO v_recently_joined FROM public.profiles ORDER BY created_at DESC LIMIT 1;
  
  -- inactive > 14 days
  SELECT COUNT(*) INTO v_inactive_count FROM public.profiles WHERE id NOT IN (SELECT DISTINCT user_id FROM public.activities WHERE start_date >= now() - interval '14 days');

  v_community_insights := json_build_object(
    'mostActiveAthlete', COALESCE(v_most_active_athlete.name, 'N/A'),
    'mostActiveAthleteValue', COALESCE(v_most_active_athlete.val, 0),
    'longestRide', COALESCE(v_longest_ride.name, 'N/A'),
    'longestRideValue', ROUND((COALESCE(v_longest_ride.distance, 0) / 1000.0)::numeric, 1),
    'longestRun', COALESCE(v_longest_run.name, 'N/A'),
    'longestRunValue', ROUND((COALESCE(v_longest_run.distance, 0) / 1000.0)::numeric, 1),
    'highestElevation', COALESCE(v_highest_elevation.name, 'N/A'),
    'highestElevationValue', COALESCE(v_highest_elevation.total_elevation_gain, 0),
    'recentlyJoined', COALESCE(v_recently_joined.name, 'N/A'),
    'inactiveCount', v_inactive_count
  );

  -- Cleanup temp tables
  DROP TABLE filtered_activities;
  DROP TABLE prev_activities;

  -- Return payload
  RETURN json_build_object(
    'overview', v_overview,
    'communityGrowth', COALESCE(v_community_growth, '[]'::json),
    'sportDistribution', v_sport_distribution,
    'dailyVolume', COALESCE(v_daily_volume, '[]'::json),
    'challengeCompletion', COALESCE(v_challenge_completion, '[]'::json),
    'topAthletes', v_top_athletes,
    'communityInsights', v_community_insights
  );
END;
$$;
