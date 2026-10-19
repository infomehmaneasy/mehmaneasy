"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
import EnquiryModal from "@/components/EnquiryModal";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

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
    !checkIn || !checkOut || new Date(checkOut) > new Date(checkIn);
  const nights =
    checkIn && checkOut && tripDatesValid
      ? (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) /
        86_400_000
      : 0;
  const nightlyRate = Number(property.price);
  const cleaningFee = Number(property.cleaningFee) || 0;
  const accommodationTotal = nights * nightlyRate;
  const estimatedTotal = accommodationTotal + cleaningFee;
  const stayMessage = [
    checkIn && checkOut
      ? `I am interested in ${checkIn} to ${checkOut}`
      : "I would like to ask about availability",
    `${guests} ${guests === 1 ? "guest" : "guests"}`,
  ].join(". ");

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
                Approximate location · {property.city}
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
                      Approximate area · {property.city}
                    </p>
                    <p className="mt-1 text-xs text-[#65716a]">
                      Exact address and map details are shared after a confirmed booking.
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
              <button
                type="button"
                disabled={!tripDatesValid}
                onClick={() => setShowEnquiry(true)}
                className="mt-4 w-full rounded-full bg-[#bd604a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a94d39] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ask support about this stay
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-[#758078]">
                This sends a question to Mehmaan Easy support, not the host.
                Booking and payment are not enabled yet.
              </p>
              <div className="mt-5 flex items-start gap-2 border-t border-[#eeeeea] pt-4 text-xs leading-5 text-[#65716a]">
                <Heart size={15} className="mt-0.5 shrink-0 text-[#bd604a]" />
                Dates are requests only; availability is confirmed by support.
              </div>
            </aside>
          </div>
        </motion.div>
      </section>

      {showEnquiry && (
        <EnquiryModal
          property={{
            ...property,
            id: property.id || property._id,
          }}
          initialMessage={stayMessage}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </main>
  );
}
