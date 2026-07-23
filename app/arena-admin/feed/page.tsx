import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedManagementClient from "./FeedManagementClient";

export default async function FeedManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "challenge_admin", "organization_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch recent feed items for management
  const { data: feedItems } = await supabase
    .from("community_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return <FeedManagementClient feedItems={feedItems || []} userId={user.id} />;
}
