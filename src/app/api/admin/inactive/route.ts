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
    // 1. Get all subscription records
    const { data: subs, error: subsError } = await adminSupabase
      .from("users_subscriptions")
      .select("user_id, is_premium");

    if (subsError) throw subsError;

    const subMap = new Map<string, boolean>();
    for (const s of subs ?? []) {
      subMap.set(s.user_id, s.is_premium);
    }

    // 2. Fetch profiles to get phone numbers and app-specific activity dates
    const { data: profiles, error: profilesError } = await adminSupabase
      .from("user_profiles")
      .select("user_id, last_active_date, phone");

    if (profilesError) throw profilesError;

    const profileMap = new Map<string, any>();
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, p);
    }

    // 3. Fetch auth users list for emails and last_sign_in_at timestamps
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers();
    if (authError) throw authError;

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const inactiveUsersList: any[] = [];

    // 4. Merge and evaluate inactivity for ALL users
    for (const authUser of authData?.users ?? []) {
      const isPremium = subMap.get(authUser.id) || false;
      const profile = profileMap.get(authUser.id);
      
      // Determine the latest activity date
      let lastActiveDate: Date | null = null;

      if (profile?.last_active_date) {
        lastActiveDate = new Date(profile.last_active_date);
      }
      
      if (authUser.last_sign_in_at) {
        const signInDate = new Date(authUser.last_sign_in_at);
        if (!lastActiveDate || signInDate > lastActiveDate) {
          lastActiveDate = signInDate;
        }
      }

      // If no activity has ever been recorded, fall back to when the user was created
      const computedActivity = lastActiveDate || new Date(authUser.created_at);

      // Check if computed activity is older than 2 days
      if (computedActivity < twoDaysAgo) {
        inactiveUsersList.push({
          id: authUser.id,
          email: authUser.email || "Unknown",
          last_active_date: computedActivity.toISOString(),
          phone: profile?.phone || authUser.phone || null,
          is_premium: isPremium,
        });
      }
    }

    return NextResponse.json({ users: inactiveUsersList });
  } catch (e: any) {
    console.error("Inactive fetch error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
