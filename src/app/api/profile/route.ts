import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");
  if (!requestedUserId || !adminSupabase) {
    return NextResponse.json({ profile: null });
  }

  // Get the authenticated user
  const authUser = await getValidatedUser();
  const isOwner = authUser?.id === requestedUserId;

  const { data } = await adminSupabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", requestedUserId)
    .maybeSingle();

  // Scrub sensitive info if the requester is not the profile owner
  let safeProfile = data;
  if (data && !isOwner) {
    safeProfile = {
      ...data,
      phone: undefined, // Redact phone
      // Add other sensitive fields to redact if needed
    };
  }

  // Fetch user progress for weekly chart
  const { data: progress } = await adminSupabase
    .from("user_progress")
    .select("xp_earned, last_reviewed_at")
    .eq("user_id", requestedUserId);

  const weeklyXp = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const now = new Date();
  const todayNum = now.getDay(); // 0 (Sun) to 6 (Sat)
  const shiftToday = todayNum === 0 ? 6 : todayNum - 1;

  // Start of week (Monday 00:00:00 local time)
  const monday = new Date(now);
  monday.setDate(now.getDate() - shiftToday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  if (progress) {
    progress.forEach(p => {
      if (!p.last_reviewed_at || !p.xp_earned) return;
      const reviewDate = new Date(p.last_reviewed_at);
      if (reviewDate >= monday && reviewDate <= sunday) {
        const day = reviewDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const dayIdx = day === 0 ? 6 : day - 1; // Mon=0, ..., Sun=6
        weeklyXp[dayIdx] += p.xp_earned;
      }
    });
  }

  return NextResponse.json({ profile: safeProfile, weeklyXp });
}

export async function POST(req: Request) {
  if (!adminSupabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  try {
    const user = await getValidatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { phone, display_name } = await req.json();
    
    const updateData: any = { user_id: userId, updated_at: new Date().toISOString() };
    if (phone !== undefined) updateData.phone = phone;
    if (display_name !== undefined) updateData.display_name = display_name;
    
    await adminSupabase
      .from("user_profiles")
      .upsert(updateData);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
