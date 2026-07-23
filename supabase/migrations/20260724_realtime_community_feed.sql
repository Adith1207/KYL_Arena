-- Database Migration: Create realtime community_feed table
-- Date: 2026-07-24
-- Purpose: Replace old feed with realtime schema.

DROP TABLE IF EXISTS public.community_feed CASCADE;

CREATE TABLE public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  challenge_id UUID,
  challenge_title TEXT,
  visibility TEXT DEFAULT 'public',
  target_type TEXT,
  target_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_community_feed_created_at ON public.community_feed(created_at DESC);
CREATE INDEX idx_community_feed_type ON public.community_feed(type);
CREATE INDEX idx_community_feed_challenge_id ON public.community_feed(challenge_id);
CREATE INDEX idx_community_feed_author_id ON public.community_feed(author_id);
CREATE INDEX idx_community_feed_priority ON public.community_feed(priority);

ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community feed viewable by everyone"
  ON public.community_feed FOR SELECT
  USING (is_deleted = false AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can insert feed items"
  ON public.community_feed FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

CREATE POLICY "Admins can update feed items"
  ON public.community_feed FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );

CREATE POLICY "Admins can delete feed items"
  ON public.community_feed FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('challenge_admin', 'super_admin', 'organization_admin')
  );


-- Community Feed Reactions
CREATE TABLE public.community_feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.community_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(feed_id, user_id, reaction)
);

ALTER TABLE public.community_feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone"
  ON public.community_feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON public.community_feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove reactions"
  ON public.community_feed_reactions FOR DELETE
  USING (auth.uid() = user_id);


-- Community Feed Reads (Unread system)
CREATE TABLE public.community_feed_reads (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL REFERENCES public.community_feed(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, feed_id)
);

ALTER TABLE public.community_feed_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own reads"
  ON public.community_feed_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark as read"
  ON public.community_feed_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status"
  ON public.community_feed_reads FOR UPDATE
  USING (auth.uid() = user_id);


-- Enable Realtime
BEGIN;
  -- remove the publication if it exists to cleanly set it up
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed_reads;

-- Add a trigger to let DB cleanly delete expired rows if we want, or we can just rely on the SELECT policy.
-- The RLS policy already filters out expired posts: `expires_at > now()`.
