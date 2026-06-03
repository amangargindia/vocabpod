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

      // Check if user already exists
      let foundUser = null;
      try {
        const { data: listData, error: listError } = await adminSupabase.auth.admin.listUsers();
        if (!listError && listData?.users) {
          foundUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        }
      } catch (err) {
        console.error("Error looking up existing user:", err);
      }

      if (foundUser) {
        authUserId = foundUser.id;
        // Ensure user is marked as premium in metadata
        await adminSupabase.auth.admin.updateUserById(authUserId, {
          app_metadata: { is_premium: true }
        });
      } else {
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
      }
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
    let razorpayCustomerId: string | null = null;

    if (razorpay_subscription_id) {
      const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);

      // Log subscription status for observability — but NEVER block on it.
      // Razorpay's handler fires the moment the user authorises payment,
      // while the status (active/authenticated) can lag by seconds.
      // The HMAC-SHA256 signature above is our cryptographic proof of payment.
      console.log("[verify] Subscription status at verification time:", subscription.status, "| sub:", razorpay_subscription_id);

      notesUserId = String(subscription?.notes?.userId || "");
      notesEmail = String(subscription?.notes?.email || "");

      // Grab customer_id from this same fetch — no second API call needed
      if (!razorpayCustomerId) {
        razorpayCustomerId = (subscription as any).customer_id || null;
      }
    } else if (razorpay_order_id) {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      console.log("[verify] Order status at verification time:", order.status, "| order:", razorpay_order_id);

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
      // razorpayCustomerId may already be set from the subscription fetch above
      // Upsert to prevent duplicate violations and ensure atomic updates
      const { error } = await adminSupabase
        .from("users_subscriptions")
        .upsert({
          user_id: authUserId,
          razorpay_customer_id: razorpayCustomerId,
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
