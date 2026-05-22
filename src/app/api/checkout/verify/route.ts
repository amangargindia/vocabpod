import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getValidatedUser } from "@/lib/serverAuth";
import Razorpay from "razorpay";

// Initialize Supabase admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authUserId = user.id;

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret missing" }, { status: 500 });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Now securely fetch the order from Razorpay to verify the notes match the authenticated user
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
      key_secret: secret,
    });
    
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (!order || order.notes?.userId !== authUserId) {
       return NextResponse.json({ error: "Order user mismatch" }, { status: 403 });
    }

    if (adminSupabase && authUserId) {
      // Explicitly delete any old rows to prevent duplicates
      await adminSupabase.from("users_subscriptions").delete().eq("user_id", authUserId);

        // Insert fresh premium status
        const { error } = await adminSupabase
          .from("users_subscriptions")
          .insert({
            user_id: authUserId,
            razorpay_customer_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            is_premium: true,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Failed to insert user subscription:", error);
          return NextResponse.json({ error: "Database update failed: " + error.message }, { status: 500 });
        }
      }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
