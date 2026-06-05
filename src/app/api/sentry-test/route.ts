import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Sentry Test Error: Verifying Server-Side Integration!");
}
