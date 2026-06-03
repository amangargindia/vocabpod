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

    // Handle subscription events
    if (event.event === "subscription.charged") {
      const subscription = event.payload.subscription?.entity || {};
      const payment = event.payload.payment?.entity || {};
      const notes = subscription.notes?.userId ? subscription.notes : payment.notes;

      if (notes && notes.userId && adminSupabase) {
        if (notes.userId === "guest-registration") {
          console.warn(`[URGENT] Webhook received for guest-registration email: ${notes.email}. User might have closed browser before account creation. Manual reconciliation required. Subscription ID: ${subscription.id}`);
          return NextResponse.json({ received: true, warning: "Guest account pending verification" });
        }

        const renewsAt = subscription.current_end 
          ? new Date(subscription.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await adminSupabase
          .from("users_subscriptions")
          .upsert({
            user_id: notes.userId,
            razorpay_customer_id: subscription.customer_id || payment.customer_id || null,
            razorpay_order_id: payment.order_id || null,
            razorpay_subscription_id: subscription.id,
            is_premium: true,
            renews_at: renewsAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error("Failed to update user subscription:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      }
    } else if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      const subscription = event.payload.subscription?.entity || {};
      const notes = subscription.notes;

      if (notes && notes.userId && adminSupabase) {
        if (notes.userId === "guest-registration") {
          return NextResponse.json({ received: true });
        }

        // Revoke premium access
        const { error } = await adminSupabase
          .from("users_subscriptions")
          .update({
            is_premium: false,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", notes.userId);

        if (error) {
          console.error("Failed to revoke user subscription:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      }
    } else if (event.event === "payment.failed") {
       // Log failure, could also notify user here
       console.warn("Payment failed for event:", event.payload.payment?.entity?.id);
    } else if (event.event === "payment.captured" || event.event === "order.paid") {
      // Fallback for one-time payments if any
      const payment = event.payload.payment?.entity || {};
      const notes = payment.notes;

      if (notes && notes.userId && adminSupabase && !payment.subscription_id) {
        if (notes.userId === "guest-registration") {
          console.warn(`[URGENT] Webhook received for guest-registration email: ${notes.email}. User might have closed browser before account creation. Manual reconciliation required. Payment ID: ${payment.id}`);
          return NextResponse.json({ received: true, warning: "Guest account pending verification" });
        }
        
        const { error } = await adminSupabase
          .from("users_subscriptions")
          .upsert({
            user_id: notes.userId,
            razorpay_customer_id: payment.customer_id || null,
            razorpay_order_id: payment.order_id,
            is_premium: true,
            renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error("Failed to update user subscription (one-time):", error);
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
