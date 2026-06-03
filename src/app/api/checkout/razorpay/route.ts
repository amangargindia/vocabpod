import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getValidatedUser } from "@/lib/serverAuth";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    const user = await getValidatedUser();
    
    if (!user && !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user ? user.id : "guest-registration";
    const userEmail = user ? (user.email || "no-email@vocabpod.com") : email;

    // Fetch existing plans to check if there is an existing plan for VocabPod Premium Monthly (₹99)
    let planId = "";
    try {
      const existingPlans = await razorpay.plans.all({ count: 100 });
      const items = existingPlans.items || [];
      const existingPlan = items.find(
        (p: any) =>
          p.item &&
          p.item.name === "VocabPod Premium Monthly" &&
          p.item.amount === 9900 &&
          p.item.currency === "INR"
      );
      if (existingPlan) {
        planId = existingPlan.id;
      }
    } catch (planError) {
      console.warn("Failed to fetch existing plans from Razorpay:", planError);
    }

    // If no plan matches, create a new one
    if (!planId) {
      try {
        const newPlan = await razorpay.plans.create({
          period: "monthly",
          interval: 1,
          item: {
            name: "VocabPod Premium Monthly",
            amount: 9900, // ₹99 in paise
            currency: "INR",
            description: "Monthly subscription to VocabPod Premium",
          },
        });
        planId = newPlan.id;
      } catch (createPlanError: any) {
        console.error("Failed to create Razorpay plan:", createPlanError);
        return NextResponse.json(
          { error: "Failed to initialize subscription plan: " + createPlanError.message },
          { status: 500 }
        );
      }
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120, // 10 years
      customer_notify: 1,
      notes: {
        userId: userId,
        email: userEmail,
      },
    });

    return NextResponse.json({
      id: subscription.id,
      amount: 9900,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription: " + error.message },
      { status: 500 }
    );
  }
}
