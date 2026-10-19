"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle, refreshProfile } = useAuth();
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

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await registerWithEmail(form);
      sessionStorage.setItem("pendingVerifyEmail", form.email);
      router.push("/verify");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleRegister() {
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      const user = result.user;

      // Register the Google user in MongoDB
      const res = await fetch("/api/auth/google-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          name: user.displayName || "Google User",
          role: form.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register profile in database.");
      }

      await refreshProfile();
      router.push("/dashboard");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Google sign-up failed.");
    } finally {
      setSubmitting(false);
    }
  }



  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-md mx-auto px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-600 mb-2">Get started</p>
          <h1 className="font-display font-800 text-3xl text-cream mb-1">Create your account</h1>
          <p className="text-cream/55 text-sm mb-8">
            Choose how you’ll use Mehmaan Easy. We’ll email a 6-digit code to verify your address.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="Full name" value={form.name} onChange={(v) => update("name", v)} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => update("password", v)}
              required
            />
            <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} required />
            <label className="text-xs text-cream/60 flex flex-col gap-1.5">
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
              <Input label="City / place" value={form.place} onChange={(v) => update("place", v)} required />
              <Input label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v)} required />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              disabled={submitting}
              className="mt-3 px-5 py-3 rounded-full bg-gold text-ink font-700 text-sm disabled:opacity-50 hover:bg-gold-soft transition-colors"
            >
              {submitting ? "Creating account…" : "Create account & send code"}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-ink-line/40"></div>
            <span className="flex-shrink mx-4 text-cream/40 text-xs">or</span>
            <div className="flex-grow border-t border-ink-line/40"></div>
          </div>

          <button
            onClick={handleGoogleRegister}
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

function Input({ label, type = "text", value, onChange, required }) {
  return (
    <label className="text-xs text-cream/60 flex flex-col gap-1.5">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-ink-panel border border-ink-line px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
      />
    </label>
  );
}
