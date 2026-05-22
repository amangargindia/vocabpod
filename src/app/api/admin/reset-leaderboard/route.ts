import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: Request) {
  if (!adminSupabase) {
    return NextResponse.json({ error: "Admin Supabase client not configured" }, { status: 500 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const email = authHeader.replace("Bearer ", "").trim();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    if (!adminEmails.includes(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Reset total_xp for all users to 0
    const { error } = await adminSupabase
      .from("user_profiles")
      .update({ total_xp: 0 })
      // Use ne to trigger bulk update, or is not null
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); 
      
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Leaderboard reset successfully" });
  } catch (error: any) {
    console.error("Error resetting leaderboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
