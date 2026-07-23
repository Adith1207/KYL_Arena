import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CommunityClient from "./CommunityClient";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CommunityClient userId={user.id} />;
}
