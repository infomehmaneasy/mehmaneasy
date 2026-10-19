"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";

function getSafeNextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "/dashboard";
}

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    place: "",
    pincode: "",
    role: "guest",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    const next = getSafeNextPath();
    setNextPath(next);
    if (next === "/post") update("role", "host");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await registerWithEmail(form);
      if (result.session) {
        router.replace(getSafeNextPath());
        return;
      }
      sessionStorage.setItem("pendingVerifyEmail", form.email);
      router.push("/verify");
    } catch (submitError) {
      setError(submitError.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleRegister() {
    setError("");
    setSubmitting(true);
    try {
      const next = getSafeNextPath();
      window.localStorage.setItem("pendingGoogleNext", next);
      await loginWithGoogle(form.role);
    } catch (googleError) {
      setError(googleError.message || "Google sign-up failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-md px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-2 text-[11px] font-600 uppercase tracking-[0.3em] text-gold">Get started</p>
          <h1 className="mb-1 font-display text-3xl font-800 text-cream">Create your account</h1>
          <p className="mb-8 text-sm text-cream/55">
            Create an account to save stays, request bookings, or share a property with guests.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="Full name" value={form.name} onChange={(value) => update("name", value)} required />
            <Input label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} required />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => update("password", value)}
              required
            />
            <Input label="Phone" value={form.phone} onChange={(value) => update("phone", value)} required />
            <label className="flex flex-col gap-1.5 text-xs text-cream/60">
              I am joining as
              <select
                value={form.role}
                onChange={(event) => update("role", event.target.value)}
                className="rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
              >
                <option value="guest">A guest looking for stays</option>
                <option value="host">A host listing my property</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input label="City / place" value={form.place} onChange={(value) => update("place", value)} required />
              <Input label="Pincode" value={form.pincode} onChange={(value) => update("pincode", value)} required />
            </div>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            <button
              disabled={submitting}
              className="mt-3 rounded-full bg-gold px-5 py-3 text-sm font-700 text-ink transition-colors hover:bg-gold-soft disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-ink-line/40" />
            <span className="mx-4 flex-shrink text-xs text-cream/40">or</span>
            <div className="flex-grow border-t border-ink-line/40" />
          </div>
          <GoogleSignInButton onClick={handleGoogleRegister} disabled={submitting} />
          <p className="mt-6 text-center text-sm text-cream/55">
            Already have an account?{" "}
            <Link
              href={`/login${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              className="font-semibold text-gold hover:text-gold-soft"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

function Input({ label, type = "text", value, onChange, required }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-cream/60">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
      />
    </label>
  );
}
