import { createAdminClient } from "@/lib/supabase/server";

export type FeedEventType =
  | "announcement"
  | "challenge_created"
  | "challenge_started"
  | "challenge_joined"
  | "challenge_completed"
  | "badge_earned"
  | "achievement"
  | "milestone"
  | "leaderboard"
  | "deadline"
  | "event"
  | "maintenance"
  | "system"
  | "sync"
  | "welcome";

export type Priority = "low" | "normal" | "high" | "urgent";

export interface FeedEventPayload {
  type: FeedEventType;
  title: string;
  body: string;
  priority?: Priority;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  challenge_id?: string;
  challenge_title?: string;
  visibility?: "public" | "private" | "admin";
  target_type?: string;
  target_value?: string;
  metadata?: Record<string, any>;
  is_pinned?: boolean;
  expires_at?: string; // ISO String
}

export async function createFeedEvent(payload: FeedEventPayload) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("community_feed")
    .insert([{
      type: payload.type,
      title: payload.title,
      body: payload.body,
      priority: payload.priority || "normal",
      author_id: payload.author_id,
      author_name: payload.author_name,
      author_avatar: payload.author_avatar,
      challenge_id: payload.challenge_id,
      challenge_title: payload.challenge_title,
      visibility: payload.visibility || "public",
      target_type: payload.target_type,
      target_value: payload.target_value,
      metadata: payload.metadata || {},
      is_pinned: payload.is_pinned || false,
      expires_at: payload.expires_at,
    }]);

  if (error) {
    console.error("Error creating feed event:", error);
    return null;
  }
  
  return data;
}
