import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LogPayload } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const logs: LogPayload[] = body.logs;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ success: true, message: "No logs provided." });
    }

    // Map to Supabase column names
    const insertData = logs.map(log => ({
      level: log.level,
      category: log.category,
      message: log.message,
      user_id: log.userId,
      request_id: log.requestId,
      status: log.status,
      metadata: log.metadata
    }));

    // Serverless: explicitly await to prevent execution context termination
    const { error } = await supabase.from("application_logs").insert(insertData);

    if (error) {
      console.error("Failed to insert batched logs:", error.message);
      return NextResponse.json({ error: "Failed to save logs" }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: insertData.length });
  } catch (err: any) {
    console.error("Error in logs API:", err);
    return NextResponse.json({ error: "Server error handling logs" }, { status: 500 });
  }
}
