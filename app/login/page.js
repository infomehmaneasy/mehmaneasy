"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (googleError) {
      setError(googleError.message || "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-md px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-2 text-[11px] font-600 uppercase tracking-[0.3em] text-gold">Welcome back</p>
          <h1 className="mb-8 font-display text-3xl font-800 text-cream">Log in</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-cream/60">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-cream/60">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
            </label>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            <button
              disabled={submitting}
              className="mt-3 rounded-full bg-gold px-5 py-3 text-sm font-700 text-ink transition-colors hover:bg-gold-soft disabled:opacity-50"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>
          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-ink-line/40" />
            <span className="mx-4 flex-shrink text-xs text-cream/40">or</span>
            <div className="flex-grow border-t border-ink-line/40" />
          </div>
          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-ink-line px-5 py-3 text-sm font-600 text-cream transition-colors hover:bg-cream/5 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </motion.div>
      </section>
    </main>
  );
}
