import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Basic Auth Check via Header
    const authHeader = req.headers.get("Authorization");
    const userEmail = authHeader?.replace("Bearer ", "");
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    // Fetch auth users
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Fetch subscriptions (sorted by updated_at descending to prioritize latest updates)
    const { data: subData, error: subError } = await adminSupabase
      .from("users_subscriptions")
      .select("user_id, is_premium")
      .order("updated_at", { ascending: false });
    if (subError) throw subError;

    // Fetch progress stats
    const { data: progData, error: progError } = await adminSupabase
      .from("user_progress")
      .select("user_id, is_completed");
    if (progError) throw progError;

    // Merge data
    const users = authData.users.map(u => {
      const sub = subData.find((s: any) => s.user_id === u.id);
      const progress = progData.filter((p: any) => p.user_id === u.id && p.is_completed);
      return {
        id: u.id,
        email: u.email,
        phone: u.phone || "N/A",
        provider: u.app_metadata?.provider || "email",
        last_sign_in_at: u.last_sign_in_at || null,
        created_at: u.created_at,
        is_premium: sub?.is_premium || false,
        words_learned: progress.length
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Admin Users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const userEmail = authHeader?.replace("Bearer ", "");
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Manually delete progress records (in case cascade is not set up correctly in SQL)
    await adminSupabase.from("user_progress").delete().eq("user_id", userId);

    // 2. Manually delete subscription records
    await adminSupabase.from("users_subscriptions").delete().eq("user_id", userId);

    // 3. Finally delete the user from Auth
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: "Auth Deletion Failed: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Admin User delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const userEmail = authHeader?.replace("Bearer ", "");
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    const { userId, isPremium } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Explicitly delete any old rows to prevent duplicates from conflicting primary keys
    await adminSupabase.from("users_subscriptions").delete().eq("user_id", userId);

    // Insert the clean new status
    const { error } = await adminSupabase
      .from("users_subscriptions")
      .insert({
        user_id: userId,
        is_premium: isPremium,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json({ error: "Insert Failed: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Subscription updated to ${isPremium ? 'Premium' : 'Free'}` });
  } catch (error: any) {
    console.error("Admin User patch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
