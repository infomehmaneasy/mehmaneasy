"use client";

import { useEffect, useState } from "react";

export default function MaintenanceControlPanel({ triggerLabel }) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSettings() {
    const response = await fetch("/api/maintenance/control", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load maintenance settings.");
    setEnabled(Boolean(data.maintenance.enabled));
    setMessage(data.maintenance.message || "");
  }

  async function openControls() {
    setOpen(true);
    setError("");
    setNotice("");
    setChecking(true);
    try {
      const response = await fetch("/api/maintenance/access", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to verify maintenance access.");
      setAuthorized(data.authorized);
      if (data.authorized) await loadSettings();
    } catch (accessError) {
      setError(accessError.message || "Unable to verify maintenance access.");
    } finally {
      setChecking(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/maintenance/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Maintenance sign-in failed.");
      setAuthorized(true);
      setPassword("");
      await loadSettings();
      window.dispatchEvent(new Event("mehmaan-easy:maintenance-updated"));
    } catch (accessError) {
      setPassword("");
      setError(accessError.message || "Maintenance sign-in failed.");
    } finally {
      setChecking(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/maintenance/control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save maintenance settings.");
      setEnabled(data.maintenance.enabled);
      setMessage(data.maintenance.message);
      setNotice(data.maintenance.enabled
        ? "Maintenance mode is on. Visitors will see your message."
        : "Maintenance mode is off. The website is available to visitors.");
      window.dispatchEvent(new Event("mehmaan-easy:maintenance-updated"));
    } catch (saveError) {
      setError(saveError.message || "Unable to save maintenance settings.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openControls}
        title="Open developer maintenance controls"
        className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd84]"
      >
        {triggerLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07120f]/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            aria-labelledby="maintenance-control-title"
            aria-modal="true"
            role="dialog"
            className="w-full max-w-lg rounded-[28px] border border-[#e8e7e1] bg-white p-6 text-[#27332d] shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b804b]">
                  Restricted site controls
                </p>
                <h2 id="maintenance-control-title" className="mt-2 text-2xl font-semibold">
                  Website availability
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close site controls"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#e0e1dc] px-3 py-1 text-lg leading-6 text-[#526058]"
              >
                ×
              </button>
            </div>

            {checking ? (
              <p className="mt-6 text-sm text-[#65716a]">Verifying developer access…</p>
            ) : authorized ? (
              <form onSubmit={save} className="mt-6 space-y-5">
                <label className="flex items-start gap-3 rounded-2xl border border-[#e5e4dc] bg-[#f8f7f3] p-4">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#173b36]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Enable maintenance mode</span>
                    <span className="mt-1 block text-xs leading-5 text-[#65716a]">
                      Visitors cannot access the site or create accounts while this is on.
                    </span>
                  </span>
                </label>
                <label className="block text-xs font-semibold text-[#34433b]">
                  Message shown to visitors
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={1000}
                    required={enabled}
                    rows={4}
                    placeholder="Tell visitors why the website is temporarily unavailable."
                    className="mt-2 w-full resize-y rounded-xl border border-[#d8d9d2] bg-white px-3 py-2.5 text-sm font-normal text-[#27332d] outline-none focus:border-[#173b36]"
                  />
                </label>
                <p className="text-xs leading-5 text-[#65716a]">
                  Developer access is separate from the customer and admin accounts.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-[#173b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#25564e] disabled:opacity-60"
                >
                  {saving ? "Saving…" : enabled ? "Enable maintenance mode" : "Save and turn off maintenance"}
                </button>
              </form>
            ) : (
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <p className="text-sm leading-6 text-[#65716a]">
                  Sign in with the separate developer maintenance credentials.
                </p>
                <label className="block text-xs font-semibold text-[#34433b]">
                  Developer email
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d8d9d2] bg-white px-3 py-2.5 text-sm font-normal text-[#27332d] outline-none focus:border-[#173b36]"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#34433b]">
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d8d9d2] bg-white px-3 py-2.5 text-sm font-normal text-[#27332d] outline-none focus:border-[#173b36]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={checking}
                  className="w-full rounded-full bg-[#173b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#25564e] disabled:opacity-60"
                >
                  {checking ? "Verifying…" : "Verify developer and continue"}
                </button>
              </form>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff1ed] p-3 text-sm text-[#8d392c]">{error}</p>}
            {notice && <p role="status" className="mt-4 rounded-xl bg-[#edf5ef] p-3 text-sm text-[#376247]">{notice}</p>}
          </section>
        </div>
      )}
    </>
  );
}
