import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function DELETE(req: Request) {
  if (!adminSupabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (!category) return NextResponse.json({ error: "Category required" }, { status: 400 });

    const { error } = await adminSupabase
      .from("words")
      .update({ category: null })
      .eq("category", category);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
