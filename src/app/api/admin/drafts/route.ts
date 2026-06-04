import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim());
  return adminEmails.includes(email);
}

// GET /api/admin/drafts — fetch all drafts for the authed admin user
export async function GET() {
  try {
    const user = await getValidatedUser();
    if (!user?.email || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminSupabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data, error } = await adminSupabase
      .from("word_drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array gracefully
      if (error.code === "42P01") {
        return NextResponse.json({ drafts: [] });
      }
      throw error;
    }

    // Deserialise: each row has `data` JSONB column with draft fields
    const drafts = (data || []).map((row: any) => ({
      ...(row.data || {}),
      id: row.id,
      word: row.word,
      status: row.status,
    }));

    return NextResponse.json({ drafts });
  } catch (err: any) {
    console.error("GET /api/admin/drafts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/drafts — upsert a draft (create or update)
export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!user?.email || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminSupabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { id, word, status, ...rest } = body;

    // Upsert by (user_id, word) — if same word exists for this admin, update it
    const payload: any = {
      user_id: user.id,
      word: (word || "").toLowerCase(),
      status: status || "idea",
      data: { id, word, status, ...rest },
      updated_at: new Date().toISOString(),
    };

    // If id is a legacy Date.now() string (not UUID), don't send it as primary key
    // Let Supabase generate the UUID on insert
    const { data, error } = await adminSupabase
      .from("word_drafts")
      .upsert(payload, { onConflict: "user_id,word" })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist yet — return success silently (localStorage fallback handles it)
        return NextResponse.json({ success: true, draft: body });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      draft: { ...(data.data || {}), id: data.id, word: data.word, status: data.status },
    });
  } catch (err: any) {
    console.error("POST /api/admin/drafts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/drafts?id=<uuid_or_word> — remove a draft
export async function DELETE(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!user?.email || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!adminSupabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const url = new URL(req.url);
    const word = url.searchParams.get("word");
    const id = url.searchParams.get("id");

    if (!word && !id) {
      return NextResponse.json({ error: "Missing word or id param" }, { status: 400 });
    }

    let query = adminSupabase.from("word_drafts").delete().eq("user_id", user.id);
    if (word) query = query.eq("word", word.toLowerCase());
    else if (id) query = query.eq("id", id);

    const { error } = await query;

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/drafts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
