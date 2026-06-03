"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { getUser, getUserSubscription } from "@/lib/supabase";

export default function UpgradePage() {
  const [user, setUser] = useState<{ id?: string, email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getUser();
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      setUser(currentUser);
      
      const sub = await getUserSubscription();
      setIsPremium(sub.is_premium);
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/razorpay", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id || "mock-user-id", 
          email: user?.email 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error("Razorpay gateway is not loaded yet. Please wait a second and try again.");
      }

      const options: any = {
        key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SrJd1y0Lk6wJWM",
        name: "VocabPod",
        description: "Monthly Premium Subscription",
        subscription_id: data.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user?.id || "mock-user-id"
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
            
            window.location.href = "/upgrade/success";
          } catch (e: any) {
            console.error(e);
            setError("Verification Failed: " + (e.message || e));
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
        prefill: { email: user?.email },
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
      setError(err.message || "Failed to start checkout");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-absolute-black flex items-center justify-center"><div className="w-4 h-4 bg-terracotta rounded-full animate-ping"></div></div>;
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-absolute-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h1 className="text-3xl font-bold text-light-gray">You are already Premium!</h1>
        <Link href="/" className="bg-terracotta text-light-gray font-bold px-6 py-3 rounded-full hover:bg-terracotta/80">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta flex flex-col items-center justify-center md:p-6">

      <div className="bg-card-gray border border-white/5 rounded-none md:rounded-3xl p-6 md:p-10 max-w-lg w-full min-h-screen md:min-h-0 flex flex-col justify-center text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="text-muted-ash hover:text-light-gray font-bold tracking-tight uppercase text-xs">&larr; Back</Link>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta/10 to-transparent pointer-events-none"></div>
        
        <h1 className="text-4xl font-black tracking-tight mb-4 relative z-10">VocabPod <span className="text-terracotta">Premium</span></h1>
        <p className="text-muted-ash mb-8 relative z-10 leading-relaxed">
          Unlock the full active-recall experience. Get unlimited access to mnemonic narratives, interactive SVG quizzes, and premium audio narrations.
        </p>

        <div className="bg-deep-canvas border border-terracotta/30 rounded-2xl p-6 mb-8 relative z-10 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-ash mb-2">Premium Subscription</span>
          <span className="text-5xl font-black text-light-gray mb-1">₹99</span>
          <span className="text-sm font-semibold text-terracotta">Per month</span>
        </div>

        {error && <p className="text-terracotta text-sm mb-4 relative z-10">{error}</p>}

        <button 
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full bg-terracotta text-light-gray font-bold py-4 rounded-full text-lg tracking-wide hover:shadow-[0_0_30px_rgba(224,75,53,0.4)] hover:-translate-y-1 transition-all relative z-10 uppercase disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Upgrade Now"}
        </button>
      </div>
    </div>
  );
}
