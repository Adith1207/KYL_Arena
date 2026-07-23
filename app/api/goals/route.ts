import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is "No rows found"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || null });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { distance_goal, elevation_goal, moving_time_goal, preferred_activity } = body;

    const { data, error } = await supabase
      .from("daily_goals")
      .upsert({
        user_id: user.id,
        distance_goal: distance_goal || 5.0,
        elevation_goal: elevation_goal || 0,
        moving_time_goal: moving_time_goal || 0,
        preferred_activity: preferred_activity || 'Any',
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
