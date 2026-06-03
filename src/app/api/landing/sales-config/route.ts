import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Cache for up to 60 s on CDN, serve stale for 5 min while revalidating
export const revalidate = 60;

const DEFAULT_CONFIG = {
  preview_word_ids: [],
  screenshots: [],
  founder_photo_url: null,
  intro_video_url: null,
  intro_video_hidden: false,
  faqs: [],
  testimonials: [],
  preview_words_data: [],
};

export async function GET() {
  if (!adminSupabase) {
    return NextResponse.json(
      { config: DEFAULT_CONFIG },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  const { data, error } = await adminSupabase
    .from("sales_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { config: DEFAULT_CONFIG },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  return NextResponse.json(
    { config: data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
