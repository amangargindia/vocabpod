import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

// Initialize Supabase admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authUserId = user.id;

    if (!adminSupabase) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }

    // Query users_subscriptions to check if there is an active premium record
    const { data: subData, error: subError } = await adminSupabase
      .from("users_subscriptions")
      .select("is_premium")
      .eq("user_id", authUserId)
      .eq("is_premium", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (subError) {
      console.error("Error querying subscriptions:", subError);
      return NextResponse.json({ error: "Database query failed: " + subError.message }, { status: 500 });
    }

    if (subData && subData.length > 0 && subData[0].is_premium) {
      // User has premium record in database, but JWT claims might be stale.
      // Update app_metadata to ensure it is set to true.
      await adminSupabase.auth.admin.updateUserById(authUserId, {
        app_metadata: { is_premium: true }
      });

      return NextResponse.json({ success: true, is_premium: true });
    }

    // If no row in users_subscriptions, check if they have it in their existing auth metadata as fallback
    if (user.app_metadata?.is_premium === true) {
      // Create user subscription record in database
      await adminSupabase.from("users_subscriptions").insert({
        user_id: authUserId,
        is_premium: true,
        updated_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true, is_premium: true });
    }

    return NextResponse.json({ success: true, is_premium: false });
  } catch (error: any) {
    console.error("Restore subscription error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}