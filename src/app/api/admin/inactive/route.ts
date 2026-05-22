import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const userEmail = authHeader?.replace("Bearer ", "");
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminSupabase) {
    return NextResponse.json({ users: [] });
  }

  try {
    // Get premium subscription user IDs
    const { data: subs } = await adminSupabase
      .from("users_subscriptions")
      .select("user_id")
      .eq("is_premium", true);

    const premiumIds = (subs ?? []).map(s => s.user_id);
    if (premiumIds.length === 0) return NextResponse.json({ users: [] });

    // Get profiles not active in last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: profiles } = await adminSupabase
      .from("user_profiles")
      .select("user_id, last_active_date, phone")
      .in("user_id", premiumIds)
      .or(`last_active_date.lt.${twoDaysAgo},last_active_date.is.null`);

    if (!profiles || profiles.length === 0) return NextResponse.json({ users: [] });

    // Fetch auth info for emails
    const { data: authData } = await adminSupabase.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    for (const u of authData?.users ?? []) {
      emailMap[u.id] = u.email ?? "Unknown";
    }

    const users = profiles.map(p => ({
      id: p.user_id,
      email: emailMap[p.user_id] ?? "Unknown",
      last_active_date: p.last_active_date,
      phone: p.phone,
    }));

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
