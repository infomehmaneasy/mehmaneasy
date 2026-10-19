"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, MapPin, RefreshCw, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABELS = {
  requested: "Awaiting host response",
  confirmed: "Confirmed · payment offline",
  declined: "Not accepted",
  cancelled: "Cancelled",
  completed: "Completed",
};

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function money(value) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function BookingPanel({ direction, title, emptyTitle, emptyDetail, sharedData }) {
  const { user, getAccessToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState(null);

  const loadBookings = useCallback(async (refresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load bookings.");
      setBookings((data.bookings || []).filter((booking) => booking.direction === direction));
    } catch (loadError) {
      setError(loadError.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [direction, getAccessToken, user]);

  useEffect(() => {
    if (sharedData) return;
    if (user) loadBookings();
    else setLoading(false);
  }, [loadBookings, sharedData, user]);

  async function updateBooking(booking, action) {
    const confirmation = {
      decline: "Decline this booking request?",
      cancel: "Cancel this stay request?",
      complete: "Mark this stay as completed?",
    }[action];
    if (confirmation && !window.confirm(confirmation)) return;
    setBusyId(booking.id);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: booking.id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update this booking.");
      if (sharedData) await sharedData.refresh(true);
      else await loadBookings(true);
    } catch (updateError) {
      setError(updateError.message || "Unable to update this booking.");
    } finally {
      setBusyId("");
    }
  }

  const visibleBookings = bookings.filter((booking) =>
    direction === "admin" || (direction === "guest" && booking.guest_id === user?.id) ||
    (direction === "host" && booking.host_id === user?.id)
  );
  const currentBookings = sharedData?.bookings || visibleBookings;
  const currentLoading = sharedData?.loading ?? loading;
  const currentError = sharedData?.error || error;
  const currentRefreshing = sharedData?.refreshing ?? refreshing;
  const refresh = sharedData ? () => sharedData.refresh(true) : () => loadBookings(true);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mt-10" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-[#758078]">
            Requests and confirmations are recorded here. The platform does not collect money.
          </p>
        </div>
        <button
          type="button"
          disabled={currentRefreshing || currentLoading}
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8d9d2] px-3 py-2 text-xs font-semibold text-[#526058] disabled:opacity-50"
        >
          <RefreshCw size={14} className={currentRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {currentError && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">
          {currentError}
        </p>
      )}
      {currentLoading ? (
        <div className="mt-5 h-28 animate-pulse rounded-3xl bg-[#f0eee8]" />
      ) : currentBookings.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-[#d8d5cc] bg-white px-6 py-9">
          <h3 className="font-semibold">{emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[#758078]">{emptyDetail}</p>
          {direction === "guest" && (
            <Link href="/properties" className="mt-4 inline-flex text-sm font-semibold text-[#bd604a]">
              Explore stays
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {currentBookings.map((booking) => {
            const property = booking.property;
            const isParticipant = direction !== "admin";
            const canCancel = booking.status === "requested" ||
              (booking.status === "confirmed" && booking.check_in > today);
            const canComplete = booking.status === "confirmed" && booking.check_out <= today;
            const otherPerson = direction === "guest" ? booking.host : booking.guest;

            return (
              <article key={booking.id} className="overflow-hidden rounded-3xl border border-[#e8e7e1] bg-white">
                <div className="grid md:grid-cols-[200px_1fr]">
                  <Link href={property ? `/property/${property.id}` : "/properties"} className="block min-h-40 bg-[#f0eee8]">
                    {property?.images?.[0] && (
                      <img src={property.images[0]} alt="" className="h-full min-h-40 w-full object-cover" />
                    )}
                  </Link>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bd604a]">
                          {direction === "host" ? "Guest request" : direction === "admin" ? "Booking oversight" : "Your trip"}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[#29352f]">
                          {property?.title || "Stay"}
                        </h3>
                      </div>
                      <span className="rounded-full bg-[#f7f5f1] px-3 py-1.5 text-xs font-semibold text-[#526058]">
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#65716a]">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(booking.check_in)} – {formatDate(booking.check_out)} · {booking.nights} nights</span>
                      <span className="inline-flex items-center gap-1.5"><Users size={14} />{booking.guests} guests</span>
                      {property?.city && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{property.city}</span>}
                    </p>
                    <div className="mt-4 grid gap-1 border-t border-[#eeeeea] pt-3 text-xs text-[#526058] sm:grid-cols-2">
                      <p>Stay subtotal <strong className="text-[#29352f]">{money(booking.subtotal)}</strong></p>
                      <p>70% intended online: <strong className="text-[#29352f]">{money(booking.online_intended)}</strong></p>
                      <p>30% intended at check-in: <strong className="text-[#29352f]">{money(booking.offline_due)}</strong></p>
                      <p className="font-semibold text-[#8b5a18]">Payment not collected</p>
                    </div>
                    {booking.host_note && (
                      <p className="mt-3 rounded-xl bg-[#f7f5f1] p-3 text-xs leading-5 text-[#526058]">
                        Host note: {booking.host_note}
                      </p>
                    )}
                    {booking.status === "confirmed" || booking.status === "completed" ? (
                      <div className="mt-4 grid gap-2 rounded-xl bg-[#edf5ef] p-3 text-xs leading-5 text-[#376247] sm:grid-cols-2">
                        {property?.address && <p><strong>Stay address:</strong> {property.address}{property.pincode ? `, ${property.pincode}` : ""}</p>}
                        {otherPerson?.name && <p><strong>{direction === "guest" ? "Host" : "Guest"}:</strong> {otherPerson.name}</p>}
                        {otherPerson?.phone && <p><strong>Contact:</strong> <a className="underline" href={`tel:${otherPerson.phone}`}>{otherPerson.phone}</a></p>}
                        {otherPerson?.email && <p><strong>Email:</strong> <a className="underline" href={`mailto:${otherPerson.email}`}>{otherPerson.email}</a></p>}
                      </div>
                    ) : null}
                    {(direction === "host" || direction === "admin") && booking.status === "requested" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={busyId === booking.id} onClick={() => setConfirmBooking(booking)} className="rounded-full bg-[#20372f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Review & confirm stay</button>
                        <button type="button" disabled={busyId === booking.id} onClick={() => updateBooking(booking, "decline")} className="rounded-full border border-[#e5c6bb] px-4 py-2 text-xs font-semibold text-[#8d392c] disabled:opacity-50">Decline request</button>
                      </div>
                    )}
                    {(direction === "host" || direction === "admin") && canComplete && (
                      <button type="button" disabled={busyId === booking.id} onClick={() => updateBooking(booking, "complete")} className="mt-4 rounded-full border border-[#d8d9d2] px-4 py-2 text-xs font-semibold text-[#526058] disabled:opacity-50">Mark stay completed</button>
                    )}
                    {(direction === "guest" || direction === "admin") && canCancel && (
                      <button type="button" disabled={busyId === booking.id} onClick={() => updateBooking(booking, "cancel")} className="mt-4 rounded-full border border-[#e5c6bb] px-4 py-2 text-xs font-semibold text-[#8d392c] disabled:opacity-50">Cancel request</button>
                    )}
                    {direction === "admin" && booking.status === "confirmed" && (
                      <button type="button" disabled={busyId === booking.id} onClick={() => updateBooking(booking, "cancel")} className="ml-2 mt-4 rounded-full border border-[#e5c6bb] px-4 py-2 text-xs font-semibold text-[#8d392c] disabled:opacity-50">Cancel booking</button>
                    )}
                    {!isParticipant && direction === "admin" && booking.guest && (
                      <p className="mt-3 text-[11px] text-[#758078]">
                        {booking.guest.name} ·{" "}
                        <a className="underline" href={`mailto:${booking.guest.email}`}>{booking.guest.email}</a>{" "}
                        · <a className="underline" href={`tel:${booking.guest.phone}`}>{booking.guest.phone}</a>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {confirmBooking && (
          <motion.div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-[#14231e]/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmBooking(null)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-stay-title"
              className="w-full max-w-md rounded-3xl border border-[#e8e7e1] bg-[#fffdf9] p-6 shadow-2xl sm:p-8"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#376247]">
                  <CheckCircle2 size={24} />
                </div>
                <button
                  type="button"
                  aria-label="Close confirmation"
                  onClick={() => setConfirmBooking(null)}
                  className="rounded-full p-2 text-[#65716a] transition hover:bg-[#f0eee8] hover:text-[#29352f]"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
                Host decision
              </p>
              <h2 id="confirm-stay-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#29352f]">
                Confirm {confirmBooking.property?.title || "this stay"}?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#526058]">
                This confirms the guest&apos;s requested dates. They&apos;ll receive a confirmation and arrange payment directly with you; Mehmaan Easy will not collect payment.
              </p>
              <div className="mt-5 rounded-2xl border border-[#e8e7e1] bg-[#f7f5f1] p-4 text-sm text-[#526058]">
                <p className="font-semibold text-[#29352f]">
                  {formatDate(confirmBooking.check_in)} – {formatDate(confirmBooking.check_out)}
                </p>
                <p className="mt-1">{confirmBooking.guests} guests · {confirmBooking.nights} nights</p>
                <p className="mt-2 border-t border-[#e2dfd7] pt-2">
                  Stay subtotal <strong className="text-[#29352f]">{money(confirmBooking.subtotal)}</strong>
                </p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmBooking(null)}
                  className="rounded-full border border-[#d8d9d2] px-5 py-3 text-sm font-semibold text-[#34433b] transition hover:bg-[#f7f5f1]"
                >
                  Review later
                </button>
                <button
                  type="button"
                  disabled={busyId === confirmBooking.id}
                  onClick={() => {
                    const booking = confirmBooking;
                    setConfirmBooking(null);
                    updateBooking(booking, "confirm");
                  }}
                  className="rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d4a40] disabled:opacity-50"
                >
                  {busyId === confirmBooking.id ? "Confirming…" : "Confirm stay request"}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
