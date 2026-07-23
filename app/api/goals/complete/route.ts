import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFeedEvent } from "@/lib/feed";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { goal_distance, completed_distance } = body;
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from("daily_goal_history")
      .upsert({
        user_id: user.id,
        date: dateStr,
        goal_distance,
        completed_distance,
        completed: true,
        completion_time: new Date().toISOString()
      }, { onConflict: 'user_id, date' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Emit Feed Event
    await createFeedEvent({
      type: "achievement",
      title: "Daily Goal Achieved",
      body: `🎉 ${user.user_metadata?.full_name || "An athlete"} crushed their daily goal of ${goal_distance}km!`,
      priority: "normal",
      author_id: user.id,
      author_name: user.user_metadata?.full_name,
      author_avatar: user.user_metadata?.avatar_url,
      visibility: "public",
    });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
