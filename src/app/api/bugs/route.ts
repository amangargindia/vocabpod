import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import * as Sentry from "@sentry/nextjs";

// We use service role to bypass RLS for inserting bug reports or let RLS handle it
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { description, user_id } = await req.json();

    if (!description || description.trim() === "") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bug_reports")
      .insert({
        description: description.trim(),
        user_id: user_id || null,
        status: "open"
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting bug report:", error);
      Sentry.captureException(error);
      return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500 });
    }

    // We rely on the client-side Sentry.captureFeedback() for Sentry tracking
    // so we don't duplicate it here as a regular "Issue".

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("Bug report route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
