import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getValidatedUser } from "@/lib/serverAuth";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(req: Request) {
  try {
    const user = await getValidatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email || "no-email@vocabpod.com";

    // You can dynamically calculate amount based on selected plan here later
    const amountInINR = 99; // ₹99 placeholder

    const options = {
      amount: amountInINR * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId,
        email: email,
      },
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
