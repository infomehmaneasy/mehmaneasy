"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("pendingVerifyEmail") || "");
  }, []);

  async function resendVerification() {
    if (!email) {
      setError("Enter your email on the sign-up page first.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (resendError) throw resendError;
      setResent(true);
      window.setTimeout(() => setResent(false), 4000);
    } catch (resendError) {
      setError(resendError.message || "Unable to resend the verification email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-sm px-5 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-2 text-[11px] font-600 uppercase tracking-[0.3em] text-gold">Almost there</p>
          <h1 className="mb-2 font-display text-2xl font-800 text-cream">Check your inbox</h1>
          <p className="mb-8 text-sm text-cream/55">
            Supabase sent a verification link to{" "}
            <span className="text-cream">{email || "your email address"}</span>. Open it to confirm your account.
          </p>
          {error && <p role="alert" className="mb-4 text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={resendVerification}
            disabled={sending}
            className="w-full rounded-full border border-ink-line px-5 py-3 text-sm font-600 text-cream hover:border-gold disabled:opacity-50"
          >
            {sending ? "Sending…" : resent ? "Verification link sent" : "Resend verification link"}
          </button>
          <Link href="/login" className="mt-5 inline-block text-xs text-cream/55 hover:text-gold">
            Return to log in
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
