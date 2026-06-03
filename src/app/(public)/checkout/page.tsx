"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { signInWithPassword } from "@/lib/supabase";

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);

  useEffect(() => {
    // Check if email was collected during the demo
    const savedEmail = localStorage.getItem("vocabpod_demo_unlocked");
    if (savedEmail && savedEmail.includes("@")) {
      setEmail(savedEmail);
      setIsInitializing(false);
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Check if user already exists
      const checkRes = await fetch(`/api/checkout/check-user?email=${encodeURIComponent(email)}`);
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Failed to verify email availability");
      
      if (checkData.exists) {
        throw new Error("A user with this email address has already been registered. Please log in first.");
      }

      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize checkout");

      // Save email just in case it wasn't saved yet
      localStorage.setItem("vocabpod_demo_unlocked", email);

      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error("Razorpay gateway is not loaded yet. Please wait a second and try again.");
      }

      const options: any = {
        key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SrJd1y0Lk6wJWM",
        name: "VocabPod",
        description: "Monthly Premium Subscription",
        subscription_id: data.id,
        handler: async function (response: any) {
          // Store payment response and show password creation screen
          setPaymentDetails({
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          setIsProcessing(false);
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
        prefill: { email },
        theme: { color: "#E04B35" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError("Payment Failed. Reason: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Checkout failed");
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!paymentDetails) {
      setError("Payment details not found. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setMessage("Verifying payment & creating account...");

    try {
      // 1. Verify payment and create user in Auth database
      const verifyRes = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_subscription_id: paymentDetails.razorpay_subscription_id,
          razorpay_payment_id: paymentDetails.razorpay_payment_id,
          razorpay_signature: paymentDetails.razorpay_signature,
          email,
          password
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

      // 2. Automatically log the user in
      setMessage("Account created! Logging you in...");
      const loginRes = await signInWithPassword(email, password);
      if (!loginRes.success) {
        throw new Error(loginRes.message || "Failed to automatically sign in.");
      }

      // 3. Redirect to welcome/success page
      window.location.href = "/upgrade/success";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Account creation failed");
      setIsProcessing(false);
      setMessage("");
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-absolute-black flex items-center justify-center">
        <div className="w-4 h-4 bg-terracotta rounded-full animate-ping"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-absolute-black flex flex-col font-sans text-light-gray selection:bg-terracotta/20 selection:text-terracotta">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-8 left-8">
          <Link href="/" className="text-muted-ash hover:text-light-gray text-xs font-bold uppercase tracking-widest transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md bg-card-gray border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Complete Checkout</h1>
          <p className="text-muted-ash text-sm mb-8 leading-relaxed">
            VocabPod Premium • ₹99/month
          </p>

          {!paymentDetails ? (
            <form onSubmit={handleCheckout} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-ash mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-absolute-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors text-light-gray"
                />
              </div>
              
              {error && <p className="text-terracotta text-xs">{error}</p>}
              
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-terracotta text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? "Processing..." : "Proceed to Payment"}
                {!isProcessing && <ArrowRight size={16} />}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-4">
                <CheckCircle size={12} />
                <span>24-hour Money-Back Guarantee</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-6 relative z-10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5 justify-center">
                <CheckCircle size={14} />
                <span>Payment Complete! Set Your Password</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-ash mb-2">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-absolute-black/50 border border-white/5 rounded-xl px-4 py-4 text-sm text-muted-ash cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-ash mb-2">Choose Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-absolute-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors text-light-gray"
                />
              </div>
              
              {error && <p className="text-terracotta text-xs">{error}</p>}
              {message && <p className="text-emerald-400 text-xs text-center font-bold animate-pulse">{message}</p>}
              
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-terracotta text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? "Setting Up..." : "Create Account & Start"}
                {!isProcessing && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
