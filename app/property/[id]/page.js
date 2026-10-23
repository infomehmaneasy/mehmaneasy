"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle,
  Heart,
  MapPin,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { openTawkChat } from "@/components/TawkChatWidget";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, profile, getAccessToken, loading: authLoading } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestPhone, setGuestPhone] = useState("");
  const [requestingBooking, setRequestingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [hasBookedProperty, setHasBookedProperty] = useState(false);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [similarError, setSimilarError] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (profile?.phone) setGuestPhone(profile.phone);
  }, [profile?.phone]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    async function loadProperty() {
      try {
        const response = await fetch(`/api/properties/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "This stay could not be found.");
        }
        if (active) setProperty(data.property);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load this stay.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) loadProperty();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!property || authLoading) return;
    let active = true;
    async function loadSimilarProperties() {
      setSimilarLoading(true);
      setSimilarError("");
      try {
        const params = new URLSearchParams();
        if (property.stayTier) params.set("stayTier", property.stayTier);
        const response = await fetch(`/api/properties?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load similar stays.");

        let alreadyBooked = false;
        if (user) {
          const token = await getAccessToken();
          const bookingsResponse = await fetch("/api/bookings", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const bookingsData = await bookingsResponse.json();
          if (!bookingsResponse.ok) {
            throw new Error(bookingsData.error || "Unable to check your booking history.");
          }
          alreadyBooked = (bookingsData.bookings || []).some((booking) =>
            booking.guest_id === user.id &&
            booking.property_id === (property.id || property._id) &&
            ["requested", "confirmed", "completed"].includes(booking.status)
          );
        }

        if (active) {
          setHasBookedProperty(alreadyBooked);
          setSimilarProperties(
            (data.properties || [])
              .filter((item) => (item.id || item._id) !== (property.id || property._id))
              .sort((a, b) => Number(b.city?.toLowerCase() === property.city?.toLowerCase()) -
                Number(a.city?.toLowerCase() === property.city?.toLowerCase()))
              .slice(0, 4)
          );
        }
      } catch (loadError) {
        console.error("Unable to load similar stays or booking history:", loadError);
        if (active) setSimilarError(loadError.message || "Unable to load similar stays.");
      } finally {
        if (active) setSimilarLoading(false);
      }
    }
    loadSimilarProperties();
    return () => {
      active = false;
    };
  }, [authLoading, getAccessToken, property, user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf9]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-5 py-40 text-center text-[#65716a]">
          Loading stay details…
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-5 py-40 text-center">
          <h1 className="text-3xl font-semibold">Stay not available</h1>
          <p className="mt-3 text-sm text-[#65716a]">
            {error || "This listing may have been removed or is still being reviewed."}
          </p>
        </div>
      </main>
    );
  }

  const images = property.images?.length ? property.images : [];
  const priceBasis =
    property.priceBasis || (property.category === "Rental" ? "month" : "listing");
  const tripDatesValid =
    (!checkIn && !checkOut) ||
    (!!checkIn && !!checkOut && new Date(checkOut) > new Date(checkIn));
  const today = new Date().toISOString().slice(0, 10);
  const datesAreFuture = !!checkIn && !!checkOut && checkIn >= today && tripDatesValid;
  const nights =
    checkIn && checkOut && tripDatesValid
      ? (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) /
        86_400_000
      : 0;
  const nightlyRate = Number(property.price);
  const cleaningFee = Number(property.cleaningFee) || 0;
  const accommodationTotal = nights * nightlyRate;
  const estimatedTotal = accommodationTotal + cleaningFee;
  const canRequestBooking = priceBasis === "night";
  async function submitBookingRequest(event) {
    event.preventDefault();
    setBookingError("");
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(`/property/${id}`)}`);
      return;
    }
    if (!datesAreFuture) {
      setBookingError("Choose valid future check-in and check-out dates.");
      return;
    }
    if (!canRequestBooking) {
      setBookingError("This listing needs a nightly rate before an online request can be created. Ask support for a quote.");
      return;
    }
    setRequestingBooking(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property.id || property._id,
          checkIn,
          checkOut,
          guests,
          phone: guestPhone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to request this stay.");
      setBookingResult(data.booking);
      setHasBookedProperty(true);
    } catch (requestError) {
      setBookingError(requestError.message || "Unable to request this stay.");
    } finally {
      setRequestingBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs font-semibold text-[#376247]">
                  <BadgeCheck size={14} />
                  Mehmaan Easy verified
                </span>
                {property.stayTier && (
                  <span className="rounded-full bg-[#f8eee8] px-3 py-1.5 text-xs font-semibold text-[#9b503e]">
                    {property.stayTier} collection
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                {property.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#65716a]">
                <MapPin size={15} className="text-[#bd604a]" />
                {property.mapCoordinates ? "Exact map pin" : "Approximate location"} ·{" "}
                {property.city}
              </p>
            </div>
            {property.rating && (
              <p className="flex items-center gap-1 text-sm font-semibold">
                <span aria-hidden="true">★</span> {Number(property.rating).toFixed(1)}
                {property.reviewsCount > 0 && (
                  <span className="font-normal text-[#65716a]">
                    ({property.reviewsCount} reviews)
                  </span>
                )}
              </p>
            )}
          </div>

          {images.length > 0 ? (
            <div className="mt-7 grid h-[360px] grid-cols-2 gap-2 overflow-hidden rounded-[24px] bg-[#eeeae2] sm:h-[480px] md:grid-cols-4">
              <button
                type="button"
                onClick={() => setActiveImg(0)}
                className="col-span-2 row-span-2 overflow-hidden"
                aria-label="View main property photo"
              >
                <img
                  src={images[activeImg] || images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </button>
              {images.slice(1, 5).map((image, index) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => setActiveImg(index + 1)}
                  className="hidden overflow-hidden md:block"
                  aria-label={`View property photo ${index + 2}`}
                >
                  <img
                    src={image}
                    alt={`${property.title}, photo ${index + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                  />
                </button>
              ))}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveImg((activeImg + 1) % images.length)}
                  className="absolute sr-only"
                >
                  Next photo
                </button>
              )}
            </div>
          ) : (
            <div className="mt-7 flex h-64 items-center justify-center rounded-[24px] bg-[#f0eee8] text-sm text-[#758078]">
              Photos are being prepared for this stay.
            </div>
          )}

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImg(index)}
                  aria-label={`Select photo ${index + 1}`}
                  aria-pressed={activeImg === index}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    activeImg === index ? "border-[#bd604a]" : "border-transparent"
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="border-b border-[#e8e7e1] pb-6">
                <h2 className="text-xl font-semibold text-[#29352f]">
                  {property.propertyType || "A welcoming stay"} in {property.city}
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#65716a]">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={16} /> Sleeps {property.capacity || 2}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble size={16} /> {property.bedrooms || 0} bedrooms
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Bath size={16} /> {property.bathrooms || 0} bathrooms
                  </span>
                </div>
              </div>

              <div className="border-b border-[#e8e7e1] py-7">
                <h2 className="text-lg font-semibold">About this stay</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#65716a]">
                  {property.description}
                </p>
              </div>

              {property.amenities?.length > 0 && (
                <div className="border-b border-[#e8e7e1] py-7">
                  <h2 className="text-lg font-semibold">What this place offers</h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {property.amenities.map((amenity) => (
                      <span key={amenity} className="flex items-center gap-3 text-sm text-[#526058]">
                        <CheckCircle size={17} className="text-[#5b8a68]" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-7">
                <h2 className="text-lg font-semibold">Location</h2>
                <div className="mt-4 flex min-h-40 items-center justify-center rounded-2xl bg-[#e9eee9] p-5 text-center">
                  <div>
                    <MapPin className="mx-auto text-[#bd604a]" size={23} />
                    <p className="mt-2 text-sm font-semibold text-[#34433b]">
                      {property.mapCoordinates
                        ? `Exact map pin · ${property.city}`
                        : `Approximate area · ${property.city}`}
                    </p>
                    <p className="mt-1 text-xs text-[#65716a]">
                      {property.mapCoordinates
                        ? "The host has chosen to share this pin. The full address remains private until a confirmed booking."
                        : "The host has kept the precise location private. The full address is shared after a confirmed booking."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[24px] border border-[#e8e7e1] bg-white p-6 shadow-[0_12px_35px_rgba(32,45,37,0.08)] lg:sticky lg:top-28">
              <p className="text-2xl font-semibold text-[#29352f]">
                ₹{Number(property.price).toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-normal text-[#65716a]">
                  {priceBasis === "night"
                    ? "/ night"
                    : priceBasis === "month"
                      ? "/ month"
                      : "/ stay"}
                </span>
              </p>
              <p className="mt-2 text-xs text-[#758078]">
                Final taxes, fees, and payment terms are not yet available online.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <label className="rounded-xl border border-[#dedfd8] p-3 text-[10px] font-semibold uppercase tracking-wide text-[#65716a]">
                  <span className="flex items-center gap-1"><CalendarDays size={13} /> Check in</span>
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="mt-2 w-full bg-transparent text-xs text-[#29352f] outline-none [color-scheme:light]"
                  />
                </label>
                <label className="rounded-xl border border-[#dedfd8] p-3 text-[10px] font-semibold uppercase tracking-wide text-[#65716a]">
                  <span className="flex items-center gap-1"><CalendarDays size={13} /> Check out</span>
                  <input
                    type="date"
                    min={checkIn || undefined}
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="mt-2 w-full bg-transparent text-xs text-[#29352f] outline-none [color-scheme:light]"
                  />
                </label>
              </div>
              <label className="mt-2 block rounded-xl border border-[#dedfd8] p-3 text-[10px] font-semibold uppercase tracking-wide text-[#65716a]">
                Guests
                <select
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  className="mt-2 w-full bg-transparent text-xs text-[#29352f] outline-none"
                >
                  {Array.from({ length: Math.min(20, Math.max(1, Number(property.capacity) || 2)) }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </label>
              {!tripDatesValid && (
                <p role="alert" className="mt-3 text-xs text-[#a1392d]">
                  Check-out must be after check-in.
                </p>
              )}
              {checkIn && checkIn < today && (
                <p role="alert" className="mt-3 text-xs text-[#a1392d]">
                  Check-in must be today or later.
                </p>
              )}
              {(checkIn && !checkOut) || (!checkIn && checkOut) ? (
                <p className="mt-3 text-xs text-[#8b5a18]">Choose both dates to request a stay.</p>
              ) : null}
              {nights > 0 && priceBasis === "night" && (
                <div
                  aria-label="Estimated price breakdown"
                  className="mt-4 space-y-2 rounded-2xl bg-[#f7f5f1] p-4 text-xs text-[#526058]"
                >
                  <div className="flex justify-between gap-3">
                    <span>
                      ₹{nightlyRate.toLocaleString("en-IN")} × {nights}{" "}
                      {nights === 1 ? "night" : "nights"}
                    </span>
                    <span>₹{accommodationTotal.toLocaleString("en-IN")}</span>
                  </div>
                  {cleaningFee > 0 && (
                    <div className="flex justify-between gap-3">
                      <span>Cleaning fee</span>
                      <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#e1dfd8] pt-2 font-semibold text-[#29352f]">
                    <span>Estimated subtotal</span>
                    <span>₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>70% intended online payment</span>
                    <span>₹{(estimatedTotal * 0.7).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>30% intended at check-in</span>
                    <span>₹{(estimatedTotal * 0.3).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}</span>
                  </div>
                  <p className="border-t border-[#e1dfd8] pt-2 leading-5 text-[#758078]">
                    Estimate only, before taxes and platform fees. Booking and
                    payments are not enabled; your dates are not reserved.
                  </p>
                </div>
              )}
              {nights > 0 && priceBasis !== "night" && (
                <p className="mt-3 rounded-xl bg-[#f7f5f1] p-3 text-xs leading-5 text-[#758078]">
                  This listing is priced per {priceBasis === "month" ? "month" : "stay"}.
                  A date-based quote is not available yet; ask support to confirm
                  the price and availability.
                </p>
              )}
              {canRequestBooking && !bookingResult && (
                <form onSubmit={submitBookingRequest} className="mt-4 space-y-2">
                  <label className="block rounded-xl border border-[#dedfd8] p-3 text-[10px] font-semibold uppercase tracking-wide text-[#65716a]">
                    Contact phone
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(event) => setGuestPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-2 w-full bg-transparent text-sm font-normal normal-case text-[#29352f] outline-none"
                    />
                  </label>
                  {bookingError && (
                    <p role="alert" className="text-xs leading-5 text-[#a1392d]">{bookingError}</p>
                  )}
                  {user ? (
                    <button
                      type="submit"
                      disabled={requestingBooking || !datesAreFuture}
                      className="w-full rounded-full bg-[#bd604a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a94d39] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestingBooking ? "Sending request…" : "Request to book · no payment"}
                    </button>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/property/${id}`)}`}
                      className="block w-full rounded-full bg-[#bd604a] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#a94d39]"
                    >
                      Request this stay
                    </Link>
                  )}
                  <p className="text-center text-xs leading-5 text-[#758078]">
                    The host must confirm the request. Nothing is charged online;
                    if confirmed, payment is arranged directly at check-in.
                  </p>
                </form>
              )}
              {bookingResult && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="relative mt-4 overflow-hidden rounded-2xl border border-[#cfe2d4] bg-gradient-to-br from-[#f0f8f1] to-[#e8f3eb] p-5 text-[#315e41] shadow-sm"
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute right-5 top-5 text-[#4f9365]"
                    initial={{ scale: 0.3, rotate: -30 }}
                    animate={{ scale: [0.3, 1.18, 1], rotate: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                  >
                    <CheckCircle size={30} />
                  </motion.span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4f795b]">
                    Request received
                  </p>
                  <h3 className="mt-2 pr-10 text-lg font-semibold text-[#285437]">
                    Wonderful choice! Your request is on its way.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#45634d]">
                    The host will review your dates. We&apos;ll show their response in your trips. No payment has been collected, and your stay is not confirmed yet.
                  </p>
                  <p className="mt-3 text-xs font-medium text-[#587560]">
                    Request reference · {bookingResult.id.slice(0, 8)}
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-4 inline-flex rounded-full bg-[#315e41] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244b33]"
                  >
                    Track your request
                  </Link>
                </motion.div>
              )}
              {!canRequestBooking && (
                <p className="mt-4 text-xs leading-5 text-[#758078]">
                  Booking requests require a nightly rate. Chat with our team for a quote for this listing.
                </p>
              )}
              {chatError && <p role="alert" className="mt-3 text-xs text-[#8d392c]">{chatError}</p>}
              <button
                type="button"
                onClick={() => {
                  if (!openTawkChat()) setChatError("Live chat is still loading. Please try again in a moment.");
                }}
                className="mt-3 w-full rounded-full border border-[#d8d9d2] px-5 py-3 text-sm font-semibold text-[#34433b] transition hover:bg-[#f7f5f1]"
              >
                Chat with Mehmaan Easy
              </button>
              <div className="mt-5 flex items-start gap-2 border-t border-[#eeeeea] pt-4 text-xs leading-5 text-[#65716a]">
                <Heart size={15} className="mt-0.5 shrink-0 text-[#bd604a]" />
                A booking request does not reserve the dates. The host confirms availability.
              </div>
            </aside>
          </div>
          {similarError && (
            <p role="alert" className="mt-8 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{similarError}</p>
          )}
          {!hasBookedProperty && !similarLoading && !similarError && similarProperties.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#bd604a]">Keep exploring</p>
                  <h2 className="mt-2 text-2xl font-semibold">Similar stays</h2>
                </div>
                <Link href="/properties" className="text-sm font-semibold text-[#526058] hover:text-[#bd604a]">See all stays</Link>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similarProperties.map((item) => (
                  <Link key={item.id || item._id} href={`/property/${item.id || item._id}`} className="overflow-hidden rounded-2xl border border-[#e8e7e1] bg-white transition hover:-translate-y-1 hover:shadow-lg">
                    <img src={item.images?.[0] || "/logo.png"} alt={item.title} className="h-44 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#bd604a]">{item.stayTier || "Stay"}</p>
                      <h3 className="mt-1 font-semibold text-[#29352f]">{item.title}</h3>
                      <p className="mt-1 text-xs text-[#65716a]">{item.city} · {item.propertyType || "Stay"}</p>
                      <p className="mt-3 text-sm font-semibold text-[#34433b]">
                        ₹{Number(item.price).toLocaleString("en-IN")} <span className="font-normal text-[#65716a]">/ {item.priceBasis || "night"}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </section>
    </main>
  );
}
