"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bath, BedDouble, Heart, MapPin } from "lucide-react";

export default function PropertyCard({ property, index = 0, compact = false }) {
  const propertyId = String(property.id || property._id);
  const [savedIds, setSavedIds] = useState([]);
  const saved = savedIds.includes(propertyId);
  const image =
    property.images?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80";
  const price = Number(property.price || 0).toLocaleString("en-IN");
  const priceBasis =
    property.priceBasis || (property.category === "Rental" ? "month" : "listing");

  useEffect(() => {
    function syncSavedIds(event) {
      try {
        const stored =
          event.detail ||
          JSON.parse(localStorage.getItem("mehmaan-easy:wishlist:v1") || "[]");
        if (Array.isArray(stored)) {
          setSavedIds(stored.filter((id) => typeof id === "string"));
        }
      } catch (error) {
        console.error("Unable to load saved stays:", error);
      }
    }

    syncSavedIds({ detail: null });
    window.addEventListener("storage", syncSavedIds);
    window.addEventListener("mehmaan-easy:wishlist-changed", syncSavedIds);
    return () => {
      window.removeEventListener("storage", syncSavedIds);
      window.removeEventListener("mehmaan-easy:wishlist-changed", syncSavedIds);
    };
  }, []);

  function toggleSaved() {
    let currentIds = savedIds;
    try {
      const stored = JSON.parse(localStorage.getItem("mehmaan-easy:wishlist:v1") || "[]");
      if (Array.isArray(stored)) currentIds = stored.filter((id) => typeof id === "string");
    } catch (error) {
      console.error("Unable to update saved stays:", error);
    }
    const next = currentIds.includes(propertyId)
      ? currentIds.filter((id) => id !== propertyId)
      : [...currentIds, propertyId];
    setSavedIds(next);
    try {
      localStorage.setItem("mehmaan-easy:wishlist:v1", JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent("mehmaan-easy:wishlist-changed", { detail: next })
      );
    } catch (error) {
      console.error("Unable to save this stay on the device:", error);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{
        duration: 0.55,
        delay: (index % 4) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group min-w-0"
    >
      <div className={`relative overflow-hidden rounded-[16px] bg-[#e8e6de] ${compact ? "aspect-square sm:aspect-[1.28]" : "aspect-[1.28]"}`}>
        <Link
          href={`/property/${property.id || property._id}`}
          aria-label={`View ${property.title}`}
          className="absolute inset-0"
        >
          <img
            src={image}
            alt={property.title || "Stay"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />
        </Link>
        {(property.isFeatured || property.stayTier) && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold text-[#29352f] shadow-sm sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[11px]">
            {property.stayTier || "Featured stay"}
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? "Remove from saved stays" : "Save this stay"}
          aria-pressed={saved}
          onClick={toggleSaved}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-black/40 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
        >
          <Heart
            size={21}
            strokeWidth={1.8}
            className={saved ? "fill-[#bd604a] text-[#bd604a]" : "fill-black/20"}
          />
        </button>
      </div>

      <Link
        href={`/property/${property.id || property._id}`}
        className={`${compact ? "mt-2" : "mt-3"} block`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className={`line-clamp-1 font-serif font-semibold text-[#173b36] transition-colors group-hover:text-[#9d7839] ${compact ? "text-[13px] sm:text-base" : "text-base"}`}>
            {property.title || "A welcoming stay"}
          </h3>
          {property.rating && (
            <span className="shrink-0 text-xs text-[#34433b]">
              <span aria-hidden="true">★</span> {Number(property.rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className={`${compact ? "mt-0.5 text-[10px] sm:text-xs" : "mt-1 text-xs"} flex items-center gap-1 text-[#707a73]`}>
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">
            {property.city}
          </span>
        </p>
        {!compact && <div className="mt-2 flex items-center gap-3 text-xs text-[#707a73]">
          {!!property.bedrooms && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={14} /> {property.bedrooms} beds
            </span>
          )}
          {!!property.bathrooms && (
            <span className="inline-flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms} baths
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span>{property.capacity || 2}</span> guests
          </span>
        </div>}
        <p className={`${compact ? "mt-1 text-xs sm:mt-2 sm:text-sm" : "mt-2 text-sm"} text-[#29352f]`}>
          <span className="font-semibold">₹{price}</span>{" "}
          <span className="text-[#707a73]">
            {priceBasis === "night"
              ? "per night"
              : priceBasis === "month"
                ? "per month"
                : "per stay"}
          </span>
        </p>
      </Link>
    </motion.article>
  );
}
