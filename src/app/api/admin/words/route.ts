import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

function checkAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
  return adminEmails.includes(email);
}

export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!checkAdmin(user?.email)) {
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

// PATCH /api/admin/words — update specific fields on an existing word by slug
export async function PATCH(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!checkAdmin(user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Admin Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { wordSlug, ...fields } = body;

    if (!wordSlug) {
      return NextResponse.json({ error: "Missing wordSlug" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("words")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("word", wordSlug.toLowerCase())
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PATCH Word Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
