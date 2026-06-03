import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Auth admin client not initialized" }, { status: 500 });
    }

    let exists = false;
    let page = 1;
    const perPage = 100;

    // Paginate through users to check if email already exists
    while (true) {
      const { data, error } = await adminSupabase.auth.admin.listUsers({
        page,
        perPage
      });

      if (error || !data || !data.users || data.users.length === 0) {
        // If error, fail-safe by returning 500 so checkout is blocked
        if (error) {
          console.error("listUsers error:", error);
          return NextResponse.json({ error: "Failed to verify email — please try again" }, { status: 500 });
        }
        break;
      }

      exists = data.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
      if (exists) break;

      if (data.users.length < perPage) {
        break;
      }
      page++;
    }

    return NextResponse.json({ exists });
  } catch (error: any) {
    console.error("Check user error:", error);
    return NextResponse.json({ error: "Failed to check user existence" }, { status: 500 });
  }
}
