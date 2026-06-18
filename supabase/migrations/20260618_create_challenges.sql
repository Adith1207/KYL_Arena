-- Database Migration: Create challenges and challenge_participants tables
-- Date: 2026-06-18
-- Purpose: Support real challenge configuration, enrollment, and progress engine.

-- Create public.challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL,
  goal_metric TEXT NOT NULL,
  goal_target NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policies for public.challenges
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON public.challenges;
CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert challenges" ON public.challenges;
CREATE POLICY "Admins can insert challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

DROP POLICY IF EXISTS "Admins can update challenges" ON public.challenges;
CREATE POLICY "Admins can update challenges"
  ON public.challenges FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

DROP POLICY IF EXISTS "Admins can delete challenges" ON public.challenges;
CREATE POLICY "Admins can delete challenges"
  ON public.challenges FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

-- Create public.challenge_participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (challenge_id, user_id)
);

-- Enable RLS for challenge_participants
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Policies for public.challenge_participants
DROP POLICY IF EXISTS "Challenge participants are viewable by everyone" ON public.challenge_participants;
CREATE POLICY "Challenge participants are viewable by everyone"
  ON public.challenge_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;
CREATE POLICY "Users can leave challenges"
  ON public.challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Seed initial mock challenges to ensure the database has challenges
INSERT INTO public.challenges (id, title, description, sport_type, goal_metric, goal_target, start_date, end_date, banner_url, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'KYL Summer Century', 'Pedal your way to 100 kilometers over the month of June. Ride together, check your limits.', 'Ride', 'Distance', 100, '2026-06-01', '2026-06-30', 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'June Run Challenge', 'Lace up and complete 50 kilometers of running. Stay consistent throughout June.', 'Run', 'Distance', 50, '2026-06-01', '2026-06-30', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'July Elevation Climb', 'Climb 2,000 meters of total elevation gain. Any run, walk, or cycle counts.', 'Multisport', 'Elevation', 2000, '2026-07-01', '2026-07-31', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', 'upcoming'),
  ('44444444-4444-4444-4444-444444444444', 'May Walkathon', 'Cover 30 kilometers of walking to kickstart your summer fitness habit.', 'Walk', 'Distance', 30, '2026-05-01', '2026-05-31', 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=400&q=80', 'archived')
ON CONFLICT (id) DO NOTHING;
