"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BedDouble, Bath, Ruler, MapPin, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import EnquiryModal from "@/components/EnquiryModal";
import { db } from "@/lib/firebase";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProperty({ ...data.property, id: data.property._id });
        }
      } catch (e) {
        console.error("Error loading property from MongoDB:", e);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-ink">
        <Navbar />
        <div className="max-w-5xl mx-auto px-5 py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-ink">
        <Navbar />
        <p className="text-center text-cream/50 py-24 font-display text-2xl italic">Stay not found.</p>
      </main>
    );
  }

  const images = property.images?.length
    ? property.images
    : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=60"];

  return (
    <main className="min-h-screen bg-ink text-cream relative">
      <Navbar />

      {/* Blueprint lines on detail page */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none mix-blend-screen">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="detail-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#detail-grid)" />
        </svg>
      </div>

      <section className="max-w-5xl mx-auto px-5 md:px-8 py-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Main Visuals with perspective */}
          <div className="relative rounded-3xl overflow-hidden h-[360px] md:h-[480px] border border-white/10 shadow-2xl">
            <img src={images[activeImg]} alt={property.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 md:left-8">
              <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-700 bg-black/80 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
                {property.category}
              </span>
            </div>
          </div>

          {/* Image Selectors */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto py-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                    i === activeImg ? "border-gold scale-95 shadow-md" : "border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Details & Action grid */}
          <div className="grid md:grid-cols-[1.6fr_1fr] gap-8 mt-10">
            <div>
              <h1 className="font-display font-700 text-3xl md:text-5xl leading-tight text-cream italic">{property.title}</h1>
              <p className="flex items-center gap-1.5 text-cream/45 text-sm mt-3 font-body">
                <MapPin size={14} className="text-gold" /> 
                <span>Approximate location · {property.city}</span>
              </p>

              {/* Luxury Specs HUD */}
              <div className="flex items-center gap-8 mt-8 text-cream/80 text-sm border-y border-white/5 py-4">
                {!!property.bedrooms && (
                  <span className="flex items-center gap-2">
                    <BedDouble size={16} className="text-gold-soft" /> 
                    <span className="font-500">{property.bedrooms} Beds</span>
                  </span>
                )}
                {!!property.bathrooms && (
                  <span className="flex items-center gap-2">
                    <Bath size={16} className="text-gold-soft" /> 
                    <span className="font-500">{property.bathrooms} Baths</span>
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Ruler size={16} className="text-gold-soft" /> 
                  <span className="font-500">{property.area} Sqft</span>
                </span>
              </div>

              {/* Description */}
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-gold font-700 mb-3">Architectural Vision</p>
                <p className="text-cream/65 text-sm leading-relaxed font-body">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold font-700 mb-4">Features & Conveniences</p>
                  <div className="grid grid-cols-2 gap-3">
                    {property.amenities.map((a) => (
                      <span key={a} className="flex items-center gap-2.5 text-sm text-cream/70">
                        <CheckCircle size={14} className="text-gold" /> 
                        <span className="font-body text-xs">{a}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Action Card */}
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 h-fit sticky top-24 shadow-2xl">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-cream/40 mb-1">
                  {property.category === "Rental" ? "Monthly rent" : "Listing price"}
                </p>
                <p className="font-display font-700 text-gold text-3xl tracking-wide">
                  ₹{Number(property.price).toLocaleString("en-IN")}
                  {property.category === "Rental" && <span className="text-xs font-500 font-sans text-cream/50"> / mo</span>}
                </p>
              </div>

              <div className="border-t border-white/5 my-5 pt-5 flex flex-col gap-4">
                <button
                  onClick={() => setShowEnquiry(true)}
                  className="w-full py-3 rounded-full bg-gold text-ink font-700 text-xs tracking-wider uppercase hover:bg-white hover:text-ink transition-all duration-300 transform active:scale-95 shadow-lg"
                >
                  Enquire about this stay
                </button>
                <p className="text-[10px] text-cream/40 text-center font-body">
                  Exact address details are shared after booking.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {showEnquiry && <EnquiryModal property={property} onClose={() => setShowEnquiry(false)} />}
    </main>
  );
}
