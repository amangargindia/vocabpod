import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    const userEmail = user?.email;
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    const payload = await req.json();

    const { data, error } = await adminSupabase
      .from("words")
      .upsert(payload, { onConflict: "word" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Insert Word Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
