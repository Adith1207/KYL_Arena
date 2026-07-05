-- Database Migration: Create community_feed table
-- Date: 2026-07-05
-- Purpose: Back community feed section in athlete dashboard with live data.

CREATE TABLE IF NOT EXISTS public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  meta TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for community_feed
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;

-- Policies for public.community_feed
DROP POLICY IF EXISTS "Community feed is viewable by everyone" ON public.community_feed;
CREATE POLICY "Community feed is viewable by everyone"
  ON public.community_feed FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert feed items" ON public.community_feed;
CREATE POLICY "Admins can insert feed items"
  ON public.community_feed FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

DROP POLICY IF EXISTS "Admins can update feed items" ON public.community_feed;
CREATE POLICY "Admins can update feed items"
  ON public.community_feed FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

DROP POLICY IF EXISTS "Admins can delete feed items" ON public.community_feed;
CREATE POLICY "Admins can delete feed items"
  ON public.community_feed FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

-- Seed initial mock feed items to ensure the database has data
INSERT INTO public.community_feed (id, type, title, body, timestamp, meta)
VALUES 
  ('cf111111-1111-1111-1111-111111111111', 'announcement', '🚴 July Century Ride — Now Live!', 'The July Century Ride challenge is officially open. Log your first 100 km before July 31st and earn the Century Club badge.', 'Just now', 'Challenge'),
  ('cf222222-2222-2222-2222-222222222222', 'shoutout', '🏅 Shout-out: Riya Menon', 'Riya crushed the 50 km milestone in a single ride this morning. Incredible effort — the community is watching! 🔥', '2 hrs ago', 'Athlete'),
  ('cf333333-3333-3333-3333-333333333333', 'deadline', '⏰ Deadline Approaching: Monsoon Miles', 'You have 3 days left to hit your target for the Monsoon Miles challenge. Push it to the finish line!', '5 hrs ago', 'Deadline'),
  ('cf444444-4444-4444-4444-444444444444', 'milestone', '🎉 Community Hit 10,000 km!', 'Together, KYL Arena athletes have logged a cumulative 10,000 km this month. That''s the distance from Mumbai to London. Epic.', 'Yesterday', 'Milestone'),
  ('cf555555-5555-5555-5555-555555555555', 'event', '📅 Virtual Group Ride — July 12', 'Join the Saturday virtual group ride at 6:30 AM IST. Register via Strava and link your activity to the arena. All levels welcome.', 'Yesterday', 'Event'),
  ('cf666666-6666-6666-6666-666666666666', 'notice', '📌 Admin: Leaderboard Refresh', 'Leaderboards are refreshed every Sunday at midnight IST. Manual re-sync is available in your dashboard settings if needed.', '2 days ago', 'Admin')
ON CONFLICT (id) DO NOTHING;
