"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";


export default function EnquiryModal({ property, onClose, initialMessage = "" }) {
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    message: initialMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.buyerName || !form.buyerEmail || !form.buyerPhone) {
      setError("Please fill your name, email, and phone.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          buyerPhone: form.buyerPhone,
          message: form.message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit enquiry.");
      }
      const data = await res.json();
      setDone(true);
      setError(data.notificationSent ? "" : "Your question was saved, but email notification is unavailable right now.");
    } catch (err) {
      setError(err.message || "Something went wrong sending your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6"

        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cream-card w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-ink/50 hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>

          {done ? (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="text-gold-deep" size={40} />
              <h3 className="font-display font-700 text-ink text-lg">Enquiry sent</h3>
              <p className="text-ink/60 text-sm">
                Your question has been sent to Mehmaan Easy support. Hosts are
                not contacted before a booking.
              </p>
              {error && <p className="mt-2 text-xs text-amber-700">{error}</p>}
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-full bg-ink text-gold-soft text-sm font-600"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold-deep font-600">Ask Mehmaan Easy</p>
              <h3 className="font-display font-700 text-ink text-xl mt-1 mb-4">{property.title}</h3>
              <p className="mb-4 text-sm text-ink/60">
                Need current photos, amenity details, or help deciding? Our
                support team can help before you book.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  placeholder="Your name"
                  required
                  className="rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep"
                  value={form.buyerName}
                  onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                />
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  className="rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep"
                  value={form.buyerEmail}
                  onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Your phone"
                  required
                  className="rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep"
                  value={form.buyerPhone}
                  onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                />
                <textarea
                  placeholder="What would you like to know?"
                  rows={3}
                  className="rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep resize-none"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  disabled={submitting}
                  className="mt-1 px-5 py-3 rounded-full bg-ink text-gold-soft text-sm font-600 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send enquiry"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
