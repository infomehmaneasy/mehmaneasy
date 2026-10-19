"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";

function getSafeNextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "/dashboard";
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    setNextPath(getSafeNextPath());
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(getSafeNextPath());
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
      const next = getSafeNextPath();
      window.localStorage.setItem("pendingGoogleNext", next);
      await loginWithGoogle(next === "/post" ? "host" : undefined);
    } catch (googleError) {
      window.localStorage.removeItem("pendingGoogleNext");
      setError(googleError.message || "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-28 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#121b17] shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#497466,transparent_42%),linear-gradient(145deg,#1d3b32,#10231e)] p-10 md:flex">
            <div className="absolute -bottom-20 -right-12 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-10 -right-2 h-52 w-52 rounded-full border border-white/10" />
            <div className="relative">
              <img src="/logo.png" alt="" className="mb-8 h-12 w-12 rounded-2xl bg-white/95 p-1" />
              <p className="text-[11px] font-600 uppercase tracking-[0.3em] text-[#e5c970]">Welcome back</p>
              <h2 className="mt-4 max-w-sm font-display text-4xl font-700 leading-tight text-white">
                Your next memorable stay is closer than you think.
              </h2>
            </div>
            <p className="relative mt-12 max-w-xs text-sm leading-6 text-white/70">
              Sign in to discover curated stays, track your trips, or manage your hosting journey.
            </p>
          </div>
          <div className="p-6 sm:p-10 md:p-12">
            <p className="mb-2 text-[11px] font-600 uppercase tracking-[0.3em] text-gold">Mehmaan Easy</p>
            <h1 className="mb-2 font-display text-3xl font-800 text-cream">Log in</h1>
            <p className="mb-8 text-sm text-cream/55">Welcome back. Continue with your email or Google account.</p>
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
            <GoogleSignInButton onClick={handleGoogleLogin} disabled={submitting} />
            <p className="mt-7 text-center text-sm text-cream/55">
              New to Mehmaan Easy?{" "}
              <Link
                href={`/register${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                className="font-semibold text-gold hover:text-gold-soft"
              >
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
