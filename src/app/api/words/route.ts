import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!adminSupabase) {
    return NextResponse.json({ words: [] });
  }
  const { data, error } = await adminSupabase
    .from("words")
    .select("id, word, definition, level, category, is_free_preview, created_at, audio_url, phonetic, type, narrative, stickman_id, story, quiz_questions, svg_elements, custom_image_url, custom_svg")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ words: [] });
  return NextResponse.json({ words: data });
}
