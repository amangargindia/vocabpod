import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    response.cookies.set(key, JSON.stringify(value), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Must be accessible from JS for fallback
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Preferences API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
