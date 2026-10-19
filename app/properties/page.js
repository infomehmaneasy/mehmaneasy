"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";

export default function PropertiesListingPage() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Filters State
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [priceBasis, setPriceBasis] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [guests, setGuests] = useState("");
  const [amenity, setAmenity] = useState("");
  const [petFriendly, setPetFriendly] = useState(false);
  const [instantBook, setInstantBook] = useState(false);
  const [pool, setPool] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [tripDetails, setTripDetails] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKeyword(params.get("keyword") || "");
    setMinPrice(params.get("minPrice") || "");
    setMaxPrice(params.get("maxPrice") || "");
    setCategory(params.get("stayTier") || "All");
    setPropertyType(params.get("propertyType") || "All");
    setGuests(params.get("guests") || "");
    setPetFriendly(params.get("petFriendly") === "true");
    setInstantBook(params.get("instantBook") === "true");
    const checkIn = params.get("checkIn");
    const checkOut = params.get("checkOut");
    const guests = params.get("guests");
    if (checkIn || checkOut || guests) {
      setTripDetails({ checkIn, checkOut, guests });
    }
  }, []);

  // Fetch properties
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    (async () => {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Property request failed (${res.status})`);
        }
        if (active) {
          setProperties(data.properties || []);
          setFilteredProperties(data.properties || []);
        }
      } catch (e) {
        console.error("Error loading properties:", e);
        if (active) {
          setLoadError(
            e instanceof Error
              ? e.message
              : "We couldn’t load the stay collection right now."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...properties];

    // Keyword filter
    if (keyword.trim()) {
      const term = keyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.city?.toLowerCase().includes(term)
      );
    }

    if (category !== "All") {
      result = result.filter((p) => p.stayTier === category);
    }
    if (propertyType !== "All") {
      result = result.filter((p) => p.propertyType === propertyType);
    }
    if (guests) {
      result = result.filter((p) => Number(p.capacity || 1) >= Number(guests));
    }
    if (amenity) {
      result = result.filter((p) => p.amenities?.includes(amenity));
    }
    if (petFriendly) {
      result = result.filter((p) => p.petFriendly);
    }
    if (instantBook) {
      result = result.filter((p) => p.instantBook);
    }
    if (pool) {
      result = result.filter((p) =>
        p.amenities?.some((item) => item.toLowerCase().includes("pool"))
      );
    }

    if (priceBasis !== "all") {
      result = result.filter(
        (p) =>
          (p.priceBasis || (p.category === "Rental" ? "month" : "listing")) ===
          priceBasis
      );
    }
    if (minPrice) {
      result = result.filter((p) => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => Number(p.price) <= Number(maxPrice));
    }

    // Bedrooms filter
    if (bedrooms) {
      result = result.filter((p) => Number(p.bedrooms) >= Number(bedrooms));
    }

    // Area filter
    if (minArea) {
      result = result.filter((p) => Number(p.area) >= Number(minArea));
    }

    // Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "area_desc") {
      result.sort((a, b) => Number(b.area) - Number(a.area));
    } else {
      // Default: show featured and newest stays first.
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    setFilteredProperties(result);
  }, [
    properties,
    keyword,
    category,
    propertyType,
    priceBasis,
    minPrice,
    maxPrice,
    bedrooms,
    minArea,
    guests,
    amenity,
    petFriendly,
    instantBook,
    pool,
    sortBy,
  ]);

  return (
    <main className="relative min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />

      {/* Header section */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-12">
        <div className="mb-9 flex flex-col justify-between border-b border-[#e8e7e1] pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">The collection</p>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#26322c] md:text-6xl">
              Find your next <span className="font-serif font-normal italic">favourite stay.</span>
            </h1>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#707a73] md:mt-0">
            Browse approved stays by destination, price, type, or amenities.
            Hosts are never contacted directly before a booking.
          </p>
        </div>

        {/* Sticky-ready premium search and filter bar container */}
        <div className="sticky top-20 z-40 mb-10 rounded-3xl border border-[#e8e7e1] bg-white/95 p-4 shadow-[0_12px_35px_rgba(32,45,37,0.1)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="w-full flex items-center gap-2.5 rounded-2xl border border-[#e8e7e1] bg-[#fffdf9] px-4 py-3 lg:flex-1">
              <Search size={16} className="text-[#bd604a]" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by destination or stay name"
                className="w-full bg-transparent text-sm text-[#26322c] outline-none placeholder:text-[#858d87]"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Stay collection"
              className="cursor-pointer rounded-full border border-[#e8e7e1] bg-white px-4 py-2 text-xs font-semibold text-[#34433b]"
            >
              <option value="All">All collections</option>
              <option value="Royal">Royal</option>
              <option value="Gold">Gold</option>
              <option value="Easy">Easy</option>
            </select>

            {/* More filters and sorting triggers */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 cursor-pointer rounded-2xl border border-[#e8e7e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#34433b] outline-none focus:border-[#bd604a] lg:flex-none"
              >
                <option value="newest">Featured & newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="area_desc">Largest area</option>
              </select>

              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#dedfd8] px-4 py-2.5 text-xs font-semibold text-[#34433b] transition-colors hover:border-[#bd604a] hover:text-[#bd604a]"
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced Collapsible Filter options */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#ecebe6] pt-4 md:grid-cols-4">
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Stay type
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c]"
                    >
                      <option value="All">Any type</option>
                      {["Hotel", "Resort", "Villa", "Homestay", "Apartment", "Boutique Hotel", "Farmhouse", "Holiday Home", "Serviced Apartment"].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Price period
                    <select
                      value={priceBasis}
                      onChange={(e) => setPriceBasis(e.target.value)}
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c]"
                    >
                      <option value="all">Any period</option>
                      <option value="night">Per night</option>
                      <option value="month">Per month</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Min price (₹)
                    <input
                      type="number"
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c] outline-none focus:border-[#bd604a]"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Max price (₹)
                    <input
                      type="number"
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c] outline-none focus:border-[#bd604a]"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Guests
                    <input
                      min="1"
                      type="number"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c] outline-none focus:border-[#bd604a]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Minimum bedrooms
                    <input
                      type="number"
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c] outline-none focus:border-[#bd604a]"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Amenity
                    <select
                      value={amenity}
                      onChange={(e) => setAmenity(e.target.value)}
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c]"
                    >
                      <option value="">Any amenity</option>
                      {["Wi-Fi", "Air conditioning", "Free parking", "Breakfast included", "Beach access", "Kitchen", "Workspace"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#65716a]">
                    Minimum area (sqft)
                    <input
                      type="number"
                      className="rounded-xl border border-[#e0e1dc] bg-white px-3 py-2 text-sm text-[#26322c] outline-none focus:border-[#bd604a]"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                    />
                  </label>
                  <div className="col-span-2 flex flex-wrap gap-x-5 gap-y-3 md:col-span-4">
                    {[
                      ["petFriendly", "Pet friendly", petFriendly, setPetFriendly],
                      ["instantBook", "Instant book", instantBook, setInstantBook],
                      ["pool", "Swimming pool", pool, setPool],
                    ].map(([id, label, checked, setChecked]) => (
                      <label key={id} className="flex items-center gap-2 text-xs font-medium text-[#526058]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => setChecked(event.target.checked)}
                          className="accent-[#bd604a]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {tripDetails && (
          <p className="-mt-5 mb-8 text-xs leading-5 text-[#758078]">
            Search details: {tripDetails.checkIn || "Any check-in"} to{" "}
            {tripDetails.checkOut || "Any check-out"} ·{" "}
            {tripDetails.guests || "2"}{" "}
            {tripDetails.guests === "1" ? "guest" : "guests"}. Calendar
            availability is not connected yet.
          </p>
        )}

        {/* Properties Grid Display */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-3xl border border-[#e5c6bb] bg-white px-6 py-14 text-center"
          >
            <Compass size={40} className="mx-auto mb-4 text-[#bd604a]" />
            <p className="font-display text-xl italic text-[#26322c]">
              We hit a little travel snag
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#65716a]">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 rounded-full bg-[#20372f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
            >
              Try again
            </button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-24 text-center text-[#65716a]">
            <Compass size={40} className="mx-auto mb-4 text-[#bd604a]" />
            <p className="font-display text-xl italic text-[#26322c]">No stays found</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed">
              We couldn’t find any matches. Try another destination or broaden your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((p, idx) => (
              <motion.div
                key={p.id || idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.05 }}
              >
                <PropertyCard property={p} index={idx} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
