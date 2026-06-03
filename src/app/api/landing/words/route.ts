import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export const dynamic = "force-dynamic";

// Public endpoint — fetches specific words by ID for the landing page demo
// Usage: GET /api/landing/words?ids=id1,id2,id3
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0 || !adminSupabase) {
    return NextResponse.json({ words: [] });
  }

  const { data, error } = await adminSupabase
    .from("words")
    .select(
      "id, word, phonetic, type, definition, story, narrative, custom_image_url, custom_svg, audio_url, quiz_questions, real_life_usage, svg_elements"
    )
    .in("id", ids);

  if (error) {
    return NextResponse.json({ words: [] });
  }

  // Return words in the same order as the requested IDs
  const wordMap = new Map((data || []).map((w: any) => [w.id, w]));
  const ordered = ids.map((id) => wordMap.get(id)).filter(Boolean);

  return NextResponse.json({ words: ordered });
}
