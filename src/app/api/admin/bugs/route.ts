import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS for admin
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const user = await getValidatedUser();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!user?.email || !adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("bug_reports")
      .select(`
        *,
        user:auth.users (email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bugs:", error);
      return NextResponse.json({ error: "Failed to fetch bugs" }, { status: 500 });
    }

    return NextResponse.json({ bugs: data }, { status: 200 });
  } catch (err: any) {
    console.error("Admin bugs GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getValidatedUser();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    
    if (!user?.email || !adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and Status are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bug_reports")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating bug:", error);
      return NextResponse.json({ error: "Failed to update bug" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("Admin bugs PATCH error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
