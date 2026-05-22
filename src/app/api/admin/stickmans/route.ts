import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: Request) {
  if (!adminSupabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const { name, svg_code } = body;
    if (!name || !svg_code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { error } = await adminSupabase
      .from("stickmans")
      .insert({ name, svg_code });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!adminSupabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await adminSupabase
      .from("stickmans")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
