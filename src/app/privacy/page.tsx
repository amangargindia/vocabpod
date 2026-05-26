import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Vocabpod",
  description: "Privacy policy and data collection practices for Vocabpod.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen bg-absolute-black text-light-gray font-sans">
      <div className="flex-1 min-w-0">
        {/* Hero */}
        <section className="relative px-6 py-24 md:px-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-terracotta border border-terracotta/30 bg-dark-blush px-4 py-1.5 rounded-full">
              Legal & Privacy
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Privacy Policy for Vocabpod
            </h1>
            <p className="text-muted-ash text-sm uppercase tracking-widest font-bold">
              Last Updated: May 25, 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="px-6 md:px-16 pb-24 max-w-3xl mx-auto space-y-12">
          
          <div className="prose prose-invert prose-headings:font-black prose-headings:tracking-tight max-w-none prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline">
            <p className="text-lg text-muted-ash leading-relaxed">
              Welcome to Vocabpod. This Privacy Policy explains how we collect, use, and protect your information when you use our website and educational services.
            </p>

            <div className="space-y-10 mt-12">
              {/* Section 1 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">1. Information We Collect</h3>
                <p className="text-muted-ash mb-4">We collect the following types of information to provide and improve our services:</p>
                <ul className="space-y-3 text-muted-ash list-disc pl-5">
                  <li><strong className="text-light-gray font-bold">Account Details:</strong> To create an account, we require an email address. Providing a phone number is optional.</li>
                  <li><strong className="text-light-gray font-bold">Usage & Technical Data:</strong> We automatically collect technical data such as your IP address, browser type, operating system, and device identifiers. We also collect site logs to debug errors and maintain the platform.</li>
                  <li><strong className="text-light-gray font-bold">Payment Information:</strong> We charge a subscription fee of ₹99 per month. Payments are processed securely through our third-party provider, Razorpay. We do not store full credit card numbers, but we do store partial billing details for account management and verification.</li>
                  <li><strong className="text-light-gray font-bold">User-Generated Content:</strong> Vocabpod is a closed learning environment. Users cannot upload public content, images, or custom mnemonics to the platform.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">2. How We Use Your Information</h3>
                <p className="text-muted-ash mb-4">We use your data strictly for the following purposes:</p>
                <ul className="space-y-3 text-muted-ash list-disc pl-5">
                  <li><strong className="text-light-gray font-bold">Core Delivery:</strong> To deliver course materials, visual mnemonics, and storytelling content.</li>
                  <li><strong className="text-light-gray font-bold">Platform Maintenance:</strong> To analyze site logs and use Google Analytics to fix bugs and improve performance.</li>
                  <li><strong className="text-light-gray font-bold">Communication:</strong> To send newsletters, promotional offers, and updates about new modules via email.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">3. How We Share Your Information</h3>
                <p className="text-muted-ash mb-4">We do not sell your personal data. We only share it with trusted third-party service providers necessary to run Vocabpod:</p>
                <ul className="space-y-3 text-muted-ash list-disc pl-5">
                  <li><strong className="text-light-gray font-bold">Service Providers:</strong> We use Supabase for database management, Cloudflare for security and performance, and Razorpay for payment processing.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">4. Data Security</h3>
                <p className="text-muted-ash leading-relaxed">
                  We use industry-standard security measures, including encryption and secure servers, to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">5. Your Rights & Data Retention</h3>
                <ul className="space-y-3 text-muted-ash list-disc pl-5">
                  <li><strong className="text-light-gray font-bold">Account Deletion:</strong> To permanently delete your account and associated data, email <strong>shukaman5@gmail.com</strong>. We will process and complete your deletion request within <strong>24 working hours</strong>.</li>
                  <li><strong className="text-light-gray font-bold">Data Retention:</strong> If your account remains inactive for a period of <strong>6 months</strong>, we will automatically purge your data from our systems.</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div>
                <h3 className="text-xl font-black text-light-gray mb-4">6. Children's Privacy</h3>
                <p className="text-muted-ash leading-relaxed">
                  Vocabpod is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18. If you are a parent or guardian and believe we have inadvertently collected information from a minor, please let us know immediately by emailing <strong>shukaman5@gmail.com</strong> or contacting us via our site. Upon notification, we will promptly delete the associated information and account from our servers.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex justify-center">
             <Link
                href="/"
                className="bg-white/5 border border-white/10 text-light-gray font-bold px-7 py-3 rounded-full text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Back to Dashboard
              </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
