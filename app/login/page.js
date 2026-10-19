"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";


export default function LoginPage() {
  const { login, loginWithGoogle, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);
    let signedIn = false;
    try {
      const result = await loginWithGoogle();
      signedIn = true;
      const response = await fetch("/api/auth/google-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await result.user.getIdToken()}`,
        },
        body: JSON.stringify({ name: result.user.displayName || "Google User" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create your profile.");
      await refreshProfile();
      router.push("/dashboard");
    } catch (err) {
      if (signedIn) await signOut();
      setError(err.message?.replace("Firebase: ", "") || "Google Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-md mx-auto px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-600 mb-2">Welcome back</p>
          <h1 className="font-display font-800 text-3xl text-cream mb-8">Log in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="text-xs text-cream/60 flex flex-col gap-1.5">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg bg-ink-panel border border-ink-line px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
            </label>
            <label className="text-xs text-cream/60 flex flex-col gap-1.5">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg bg-ink-panel border border-ink-line px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
              />
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              disabled={submitting}
              className="mt-3 px-5 py-3 rounded-full bg-gold text-ink font-700 text-sm disabled:opacity-50 hover:bg-gold-soft transition-colors"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-ink-line/40"></div>
            <span className="flex-shrink mx-4 text-cream/40 text-xs">or</span>
            <div className="flex-grow border-t border-ink-line/40"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full border border-ink-line text-cream hover:bg-cream/5 text-sm font-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </section>
    </main>
  );
}
