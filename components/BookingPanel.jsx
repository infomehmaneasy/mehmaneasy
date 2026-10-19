"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, RefreshCw, Users } from "lucide-react";
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

export default function BookingPanel({ direction, title, emptyTitle, emptyDetail }) {
  const { user, profile, getAccessToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
    if (profile?.verified) loadBookings();
    else if (profile) setLoading(false);
  }, [loadBookings, profile]);

  async function updateBooking(booking, action) {
    const confirmation = {
      confirm: "Confirm this stay request? The guest will be told that payment is handled offline.",
      decline: "Decline this booking request?",
      cancel: "Cancel this stay request?",
      complete: "Mark this stay as completed?",
    }[action];
    if (!window.confirm(confirmation)) return;
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
      await loadBookings(true);
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
          disabled={refreshing || loading}
          onClick={() => loadBookings(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8d9d2] px-3 py-2 text-xs font-semibold text-[#526058] disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">
          {error}
        </p>
      )}
      {loading ? (
        <div className="mt-5 h-28 animate-pulse rounded-3xl bg-[#f0eee8]" />
      ) : visibleBookings.length === 0 ? (
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
          {visibleBookings.map((booking) => {
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
                        <button type="button" disabled={busyId === booking.id} onClick={() => updateBooking(booking, "confirm")} className="rounded-full bg-[#20372f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirm stay (offline payment)</button>
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
    </section>
  );
}
