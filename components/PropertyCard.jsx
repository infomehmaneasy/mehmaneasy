"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bath, BedDouble, Heart, MapPin } from "lucide-react";

export default function PropertyCard({ property, index = 0 }) {
  const [saved, setSaved] = useState(false);
  const image =
    property.images?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80";
  const isRental = property.category === "Rental";
  const price = Number(property.price || 0).toLocaleString("en-IN");

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
      <div className="relative aspect-[0.92] overflow-hidden rounded-[22px] bg-[#e8e6de]">
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
        {property.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#29352f] shadow-sm">
            Featured stay
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? "Remove from saved stays" : "Save this stay"}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-black/35"
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
        className="mt-3 block"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-[#29352f] transition-colors group-hover:text-[#bd604a]">
            {property.title || "A welcoming stay"}
          </h3>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-[#707a73]">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">
            {property.city}
          </span>
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-[#707a73]">
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
        </div>
        <p className="mt-2 text-sm text-[#29352f]">
          <span className="font-semibold">₹{price}</span>{" "}
          <span className="text-[#707a73]">
            {isRental ? "per month" : "asking price"}
          </span>
        </p>
      </Link>
    </motion.article>
  );
}
