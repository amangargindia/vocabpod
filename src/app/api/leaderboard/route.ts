import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Revalidate leaderboard every minute (60 seconds) or dynamic
export const revalidate = 0;

export async function GET() {
  if (!adminSupabase) {
    return NextResponse.json({ leaderboard: [] });
  }

  const { data, error } = await adminSupabase
    .from("user_profiles")
    .select("user_id, total_xp, display_name")
    .order("total_xp", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ leaderboard: [] });

  // Fetch auth metadata for email fallback
  const { data: authData } = await adminSupabase.auth.admin.listUsers();
  const userMap: Record<string, string> = {};
  for (const u of authData?.users ?? []) {
    userMap[u.id] = u.email ?? "Anonymous";
  }

  const leaderboard = (data ?? []).map((row, i) => {
    const fallbackEmail = userMap[row.user_id] ?? "Anonymous";
    const displayName = row.display_name || fallbackEmail.split("@")[0];
    const initial = displayName[0].toUpperCase();

    return {
      rank: i + 1,
      user_id: row.user_id,
      display: displayName,
      initial: initial,
      total_xp: row.total_xp ?? 0,
    };
  });

  return NextResponse.json({ leaderboard });
}
