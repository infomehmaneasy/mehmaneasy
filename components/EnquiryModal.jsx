"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, MailCheck } from "lucide-react";


export default function EnquiryModal({ property, onClose, initialMessage = "" }) {
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    message: initialMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
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
      setNotificationSent(Boolean(data.notificationSent));
      setDone(true);
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5ef] text-[#376247]"
              >
                <CheckCircle2 size={32} />
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bd604a]">
                Support request received
              </p>
              <h3 className="font-display text-xl font-bold text-[#29352f]">Thank you for reaching out</h3>
              <p className="max-w-sm text-sm leading-6 text-[#526058]">
                Your question has been added to the Mehmaan Easy support queue. Our team can follow up using the contact details you provided. The host is not contacted before a booking.
              </p>
              <div className="mt-1 flex items-center gap-2 rounded-full bg-[#f7f5f1] px-3 py-2 text-xs font-medium text-[#526058]">
                <MailCheck size={15} className="text-[#376247]" />
                {notificationSent ? "Support email notification sent" : "Your request is safely recorded"}
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-full bg-[#20372f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
              >
                Done
              </button>
            </motion.div>
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
                  autoComplete="name"
                  className="support-enquiry-field w-full rounded-lg border border-[#d8d9d2] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#29352f] placeholder:text-[#758078] outline-none [color-scheme:light] focus:border-[#bd604a]"
                  value={form.buyerName}
                  onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                />
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  autoComplete="email"
                  className="support-enquiry-field w-full rounded-lg border border-[#d8d9d2] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#29352f] placeholder:text-[#758078] outline-none [color-scheme:light] focus:border-[#bd604a]"
                  value={form.buyerEmail}
                  onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Your phone"
                  required
                  autoComplete="tel"
                  className="support-enquiry-field w-full rounded-lg border border-[#d8d9d2] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#29352f] placeholder:text-[#758078] outline-none [color-scheme:light] focus:border-[#bd604a]"
                  value={form.buyerPhone}
                  onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                />
                <textarea
                  placeholder="What would you like to know?"
                  rows={3}
                  className="support-enquiry-field w-full resize-none rounded-lg border border-[#d8d9d2] bg-[#fffdf9] px-3 py-2.5 text-sm text-[#29352f] placeholder:text-[#758078] outline-none [color-scheme:light] focus:border-[#bd604a]"
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
