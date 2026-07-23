-- Migration: Create daily_goals and daily_goal_history tables

-- Create daily_goals table
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_goal numeric NOT NULL DEFAULT 5.0,
  elevation_goal numeric DEFAULT 0,
  moving_time_goal numeric DEFAULT 0,
  preferred_activity text NOT NULL DEFAULT 'Any',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_daily_goal UNIQUE (user_id)
);

-- Enable RLS for daily_goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Policies for daily_goals
CREATE POLICY "Users can view their own daily goals"
ON public.daily_goals FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals"
ON public.daily_goals FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals"
ON public.daily_goals FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create daily_goal_history table
CREATE TABLE IF NOT EXISTS public.daily_goal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  goal_distance numeric NOT NULL,
  completed_distance numeric NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completion_time timestamp with time zone,
  CONSTRAINT unique_user_date_history UNIQUE (user_id, date)
);

-- Enable RLS for daily_goal_history
ALTER TABLE public.daily_goal_history ENABLE ROW LEVEL SECURITY;

-- Policies for daily_goal_history
CREATE POLICY "Users can view their own daily goal history"
ON public.daily_goal_history FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goal history"
ON public.daily_goal_history FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goal history"
ON public.daily_goal_history FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp on daily_goals
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_goals_timestamp
BEFORE UPDATE ON public.daily_goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
