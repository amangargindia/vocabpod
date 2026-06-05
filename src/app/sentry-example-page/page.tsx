"use client";

import Error from "next/error";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-absolute-black p-4">
      <div className="bg-card-gray border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-6">
        <h1 className="text-2xl font-black text-light-gray uppercase tracking-tight">Sentry Test Page</h1>
        <p className="text-muted-ash text-sm leading-relaxed">
          Click the button below to trigger a test error in your Next.js application. 
          If Sentry is properly configured, you should see the error in your dashboard.
        </p>
        <button
          onClick={() => {
            // @ts-ignore
            throw new Error("Sentry Test Error from Vocabpod!");
          }}
          className="bg-terracotta text-light-gray font-bold py-3.5 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-wider text-sm cursor-pointer"
        >
          Throw Error
        </button>
      </div>
    </div>
  );
}
