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
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_subscription_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      email, 
      password 
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret missing" }, { status: 500 });
    }

    // Verify signature
    let generated_signature = "";
    if (razorpay_subscription_id) {
      generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_payment_id + "|" + razorpay_subscription_id)
        .digest("hex");
    } else {
      generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
    }

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Retrieve or create User
    let authUserId = "";
    const authenticatedUser = await getValidatedUser();
    
    if (authenticatedUser) {
      authUserId = authenticatedUser.id;
    } else if (email && password) {
      if (!adminSupabase) {
        return NextResponse.json({ error: "Supabase admin not initialized" }, { status: 500 });
      }

      // Create new user account for guest checkout
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { is_premium: true }
      });

      if (createError) {
        console.error("Failed to create user:", createError);
        return NextResponse.json({ error: "Failed to create user: " + createError.message }, { status: 500 });
      }

      authUserId = createData.user.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Securely fetch metadata from Razorpay to verify details
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
      key_secret: secret,
    });
    
    let notesUserId = "";
    let notesEmail = "";

    if (razorpay_subscription_id) {
      const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      
      if (subscription.status !== 'active' && subscription.status !== 'authenticated' && subscription.status !== 'completed') {
         console.error("Invalid subscription status:", subscription.status);
         return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
      }

      notesUserId = String(subscription?.notes?.userId || "");
      notesEmail = String(subscription?.notes?.email || "");
    } else if (razorpay_order_id) {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      
      if (order.status !== 'paid') {
         console.error("Invalid order status:", order.status);
         return NextResponse.json({ error: "Order is not paid" }, { status: 400 });
      }

      notesUserId = String(order?.notes?.userId || "");
      notesEmail = String(order?.notes?.email || "");
    }

    // Verify it matches our authenticated/created user
    const emailToCompare = authenticatedUser ? authenticatedUser.email : email;
    
    if (notesUserId === "guest-registration") {
      if (!emailToCompare || notesEmail.toLowerCase() !== emailToCompare.toLowerCase()) {
        return NextResponse.json({ error: "Verification mismatch (email)" }, { status: 403 });
      }
    } else {
      if (notesUserId !== authUserId) {
        return NextResponse.json({ error: "Verification mismatch (user)" }, { status: 403 });
      }
    }

    if (adminSupabase && authUserId) {
      // Upsert to prevent duplicate violations and ensure atomic updates
      const { error } = await adminSupabase
        .from("users_subscriptions")
        .upsert({
          user_id: authUserId,
          razorpay_customer_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id || null,
          razorpay_subscription_id: razorpay_subscription_id || null,
          is_premium: true,
          renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Failed to upsert user subscription:", error);
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
