import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim());

function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") || "";
  const email = auth.replace("Bearer ", "").trim();
  return !!email && ADMIN_EMAILS.includes(email);
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminSupabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }
  const { data, error } = await adminSupabase
    .from("sales_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ config: data });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminSupabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const body = await req.json();
  const allowed = [
    "preview_word_ids",
    "preview_words_data",
    "screenshots",
    "founder_photo_url",
    "intro_video_url",
    "intro_video_hidden",
    "faqs",
    "testimonials",
  ];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await adminSupabase
    .from("sales_config")
    .update(updates)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ config: data });
}
