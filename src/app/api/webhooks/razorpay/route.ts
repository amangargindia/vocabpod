import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature found" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Handle payment.captured event
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload.payment.entity;
      const notes = payment.notes; // We passed userId here during order creation

      if (notes && notes.userId && adminSupabase) {
        // Upsert into users_subscriptions table
        const { error } = await adminSupabase
          .from("users_subscriptions")
          .upsert({
            user_id: notes.userId,
            razorpay_customer_id: payment.customer_id || null,
            razorpay_order_id: payment.order_id,
            is_premium: true,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Failed to update user subscription:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
