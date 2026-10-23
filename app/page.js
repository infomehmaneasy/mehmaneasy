"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  House,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";

const destinations = [
  {
    name: "Goa",
    detail: "Sun, sand & slow mornings",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Jaipur",
    detail: "Colourful city escapes",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Bengaluru",
    detail: "A greener kind of getaway",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Mumbai",
    detail: "Make a weekend of it",
    image:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=85",
  },
];

const tripIdeas = [
  { label: "A little more luxury", image: "photo-1600607687939-ce8a6c25118c" },
  { label: "Find your quiet", image: "photo-1449158743715-0a90ebb6d2d8" },
  { label: "Room for everyone", image: "photo-1600210492486-724fe5c67fb0" },
];

const storyNotes = [
  {
    title: "The slow morning",
    quote: "The long breakfast. The balcony breeze. The feeling of nowhere else to be.",
    mark: "01",
  },
  {
    title: "A place of your own",
    quote: "A thoughtful space to come back to after a day spent somewhere new.",
    mark: "02",
  },
  {
    title: "One more night",
    quote: "Little details that make a weekend away feel like time well spent.",
    mark: "03",
  },
];

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [activeIdea, setActiveIdea] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    async function loadProperties() {
      try {
        const response = await fetch("/api/properties");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Property request failed (${response.status})`);
        }
        if (active) {
          setProperties((data.properties || []).slice(0, 4));
        }
      } catch (error) {
        console.error("Unable to load featured stays:", error);
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "We couldn’t load the stay collection right now."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProperties();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function searchStays(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("keyword", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    router.push(`/properties?${params.toString()}`);
  }

  function searchCity(city) {
    router.push(`/properties?keyword=${encodeURIComponent(city)}`);
  }

  const displayedTripIdeas = tripIdeas.map(
    (_, offset) => tripIdeas[(activeIdea + offset) % tripIdeas.length]
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdf9] text-[#24302b]">
      <Navbar />

      <section className="relative flex min-h-[760px] items-end overflow-hidden bg-[#18241f] pb-12 pt-36 text-white sm:min-h-[820px] sm:pb-16 lg:min-h-[880px] lg:pb-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=90"
            alt="A sunlit villa nestled among tropical greenery"
            className="h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10211d]/80 via-[#10211d]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10211d]/80 via-transparent to-[#10211d]/20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-white backdrop-blur-md">
              <Sparkles size={14} className="text-[#f3c5a9]" />
              A more thoughtful way to get away
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Find a stay that
              <br />
              <span className="font-serif font-normal italic text-[#f6d5c3]">
                feels like yours.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Character-filled homes, warm hospitality, and little details that
              make a trip feel unforgettable.
            </p>
          </motion.div>

          <motion.form
            onSubmit={searchStays}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-9 grid max-w-5xl grid-cols-1 gap-2 rounded-[28px] bg-white p-2 text-[#24302b] shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_0.8fr_auto] lg:gap-0 lg:rounded-full"
          >
            <label className="flex min-h-[62px] flex-col justify-center rounded-2xl px-5 transition-colors hover:bg-[#f7f5f1] lg:rounded-full">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65716a]">
                Where to?
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={16} className="shrink-0 text-[#bd604a]" />
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Search destinations"
                  aria-label="Search destinations"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#24302b] outline-none placeholder:text-[#858d87]"
                />
              </span>
            </label>
            <label className="flex min-h-[62px] flex-col justify-center rounded-2xl px-5 transition-colors hover:bg-[#f7f5f1] lg:rounded-full">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65716a]">
                Check in
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={16} className="shrink-0 text-[#bd604a]" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  aria-label="Check-in date"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#526058] outline-none [color-scheme:light]"
                />
              </span>
            </label>
            <label className="flex min-h-[62px] flex-col justify-center rounded-2xl px-5 transition-colors hover:bg-[#f7f5f1] lg:rounded-full">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65716a]">
                Check out
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={16} className="shrink-0 text-[#bd604a]" />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(event) => setCheckOut(event.target.value)}
                  aria-label="Check-out date"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#526058] outline-none [color-scheme:light]"
                />
              </span>
            </label>
            <label className="flex min-h-[62px] flex-col justify-center rounded-2xl px-5 transition-colors hover:bg-[#f7f5f1] lg:rounded-full">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65716a]">
                Guests
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} className="shrink-0 text-[#bd604a]" />
                <select
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  aria-label="Number of guests"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#526058] outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <button
              type="submit"
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-full bg-[#bd604a] px-7 text-sm font-semibold text-white transition duration-300 hover:bg-[#a94d39] active:scale-[0.98] lg:min-h-0 lg:px-8"
            >
              <Search size={17} />
              <span className="lg:hidden">Search stays</span>
            </button>
          </motion.form>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck size={15} className="text-[#f6d5c3]" />
              Thoughtfully selected stays
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#f6d5c3]" />
              Hospitality with care
            </span>
          </div>
        </div>

        <a
          href="#discover"
          className="absolute bottom-8 right-8 hidden items-center gap-2 text-xs font-medium text-white/80 transition hover:text-white sm:flex"
        >
          Scroll to discover <ArrowDown size={14} />
        </a>
      </section>

      <section className="border-b border-[#e8e7e1] bg-white py-7">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-5 px-5 sm:grid-cols-4 sm:px-8 lg:px-12">
          {[
            ["A stay, not just a room", "Spaces with their own story"],
            ["Made for real moments", "Little comforts, thoughtfully chosen"],
            ["A better kind of welcome", "Hospitality that feels personal"],
            ["More places to discover", "From city weekends to slow escapes"],
          ].map(([title, detail], index) => (
            <Reveal key={title} delay={index * 0.06} className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8eee8] text-[#bd604a]">
                {index === 0 ? (
                  <House size={17} />
                ) : index === 1 ? (
                  <Heart size={17} />
                ) : index === 2 ? (
                  <Sparkles size={17} />
                ) : (
                  <MapPin size={17} />
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#29352f]">
                  {title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#758078]">
                  {detail}
                </span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="discover" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <Reveal className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              A good place to start
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#26322c] sm:text-4xl">
              Where will the weekend take you?
            </h2>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#34433b] transition hover:text-[#bd604a]"
          >
            See all stays <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {destinations.map((place, index) => (
            <motion.button
              key={place.name}
              type="button"
              onClick={() => searchCity(place.name)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              className="group text-left"
            >
              <div className="relative aspect-[0.9] overflow-hidden rounded-[24px] bg-[#e8e6de] sm:aspect-[0.88]">
                <img
                  src={place.image}
                  alt={`${place.name}, India`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.055]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="block text-xl font-semibold tracking-tight sm:text-2xl">
                    {place.name}
                  </span>
                  <span className="mt-1 block text-xs text-white/85 sm:text-sm">
                    {place.detail}
                  </span>
                </span>
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#26322c] transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section
        aria-label="Guest story previews"
        className="relative overflow-hidden bg-[#17231e] py-16 text-white sm:py-20"
      >
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full border border-white/[0.07]" />
        <div className="absolute -left-12 top-24 h-40 w-40 rounded-full border border-white/[0.08]" />
        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0b39d]">
                Guest story previews
              </p>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                The moments that make
                <br className="hidden sm:block" /> a stay feel like yours.
              </h2>
            </div>
            <p className="max-w-sm text-xs leading-5 text-white/55">
              A little inspiration while the first verified guest stories are
              gathered. These are brand notes, not customer reviews.
            </p>
          </Reveal>
        </div>

        {[false, true].map((reverse) => (
          <div
            key={reverse ? "second-rail" : "first-rail"}
            className={`story-marquee ${reverse ? "story-marquee--reverse" : ""} ${
              reverse ? "mt-3" : ""
            }`}
            aria-hidden={reverse}
          >
            <div className="story-marquee__track">
              {[...storyNotes, ...storyNotes].map((note, index) => (
                <article
                  key={`${reverse ? "reverse" : "forward"}-${note.mark}-${index}`}
                  className={`story-note story-note--${note.mark}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/50">
                      A Mehmaan moment
                    </span>
                    <span className="font-serif text-2xl italic text-[#f0b39d]">
                      {note.mark}
                    </span>
                  </div>
                  <p className="mt-6 font-serif text-xl italic leading-snug text-white sm:text-2xl">
                    “{note.quote}”
                  </p>
                  <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                    {note.title}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[#f5f2eb] py-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
                A few places we love
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#26322c] sm:text-4xl">
                Stays worth staying in for.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#707a73]">
              Browse available homes and find the one that makes your next trip
              feel like yours.
            </p>
          </Reveal>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[0.86] animate-pulse rounded-[24px] bg-white"
                />
              ))}
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="rounded-3xl border border-[#e5c6bb] bg-white px-6 py-14 text-center"
            >
              <House className="mx-auto text-[#bd604a]" size={28} />
              <h3 className="mt-4 text-lg font-semibold text-[#29352f]">
                We hit a little travel snag
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#758078]">
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
          ) : properties.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id || property._id || index}
                  property={property}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#d8d5cc] bg-white/70 px-6 py-14 text-center">
              <House className="mx-auto text-[#bd604a]" size={28} />
              <h3 className="mt-4 text-lg font-semibold text-[#29352f]">
                New stays are on their way
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#758078]">
                Explore the current collection and check back as more homes are
                added.
              </p>
              <Link
                href="/properties"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#bd604a] hover:text-[#a94d39]"
              >
                Browse the collection <ArrowRight size={16} />
              </Link>
            </div>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 rounded-full border border-[#c9ccc5] px-6 py-3 text-sm font-semibold text-[#34433b] transition hover:border-[#34433b] hover:bg-white"
            >
              Explore all properties <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <Reveal className="mb-9 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              Stay your way
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#26322c] sm:text-4xl">
              For the kind of trip you need.
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() =>
                setActiveIdea((activeIdea - 1 + tripIdeas.length) % tripIdeas.length)
              }
              aria-label="Previous trip idea"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d9d2] text-[#34433b] transition hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActiveIdea((activeIdea + 1) % tripIdeas.length)}
              aria-label="Next trip idea"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d9d2] text-[#34433b] transition hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          <AnimatePresence mode="sync">
            {displayedTripIdeas.map((idea, index) => (
              <motion.div
                key={`${idea.label}-${activeIdea}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                className={`group relative h-[300px] overflow-hidden rounded-[26px] ${
                  index === 0 ? "md:col-span-1" : ""
                }`}
              >
                <img
                  src={`https://images.unsplash.com/${idea.image}?auto=format&fit=crop&w=1000&q=85`}
                  alt={idea.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17231e]/75 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                  <h3 className="max-w-[220px] text-2xl font-semibold leading-tight tracking-tight">
                    {idea.label}
                  </h3>
                  <Link
                    href="/properties"
                    aria-label={`Explore stays: ${idea.label}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#29352f] transition hover:bg-[#f6d5c3]"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-5 flex justify-center gap-2 sm:hidden">
          {tripIdeas.map((idea, index) => (
            <button
              key={idea.label}
              type="button"
              aria-label={`Show trip idea ${index + 1}`}
              onClick={() => setActiveIdea(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIdea ? "w-6 bg-[#bd604a]" : "w-2 bg-[#c9ccc5]"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
        <Reveal className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[30px] bg-[#17231e] text-white lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden sm:min-h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85"
              alt="Warmly styled living room with layered natural textures"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-[#17231e]/35" />
            <span className="absolute bottom-5 left-5 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-xs text-white backdrop-blur-md">
              The Mehmaan moodboard · 01
            </span>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-[#f6d5c3]">
              <Sparkles size={14} /> New · Décor Studio
            </p>
            <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              A stay should feel good before you even arrive.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
              Explore thoughtfully styled spaces, discover a mood that feels
              like you, and find a stay with its own point of view.
            </p>
            <Link
              href="/decor-studio"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#20372f] transition hover:bg-[#f6d5c3]"
            >
              Step into the studio <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-[#20372f] py-20 text-white lg:py-24">
        <div className="absolute -right-24 -top-32 h-[440px] w-[440px] rounded-full border border-white/10" />
        <div className="absolute -right-5 -top-14 h-[300px] w-[300px] rounded-full border border-white/10" />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d5c3]">
              Your place could be someone’s favourite
            </p>
            <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Host with heart.
              <br />
              We’ll help with the rest.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/75">
              Bring your home to Mehmaan Easy. Our team can help you get your
              listing ready, thoughtfully presented, and ready to welcome guests.
            </p>
            <Link
              href="/post"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#20372f] transition hover:bg-[#f6d5c3]"
            >
              List your property <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.12} className="grid gap-3 sm:grid-cols-2">
            {[
              ["01", "Share your space", "Tell us about the stay you want to offer."],
              ["02", "Get listing-ready", "We’ll guide you through your property details."],
              ["03", "Welcome your guests", "Manage your listing from your dashboard."],
              ["04", "Grow with support", "Ask our team about styling and photography."],
            ].map(([step, title, description]) => (
              <div
                key={step}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm"
              >
                <span className="text-xs font-semibold tracking-[0.15em] text-[#f6d5c3]">
                  {step}
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/65">{description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-[#fffdf9] px-5 py-12 text-center sm:px-8">
        <p className="text-sm font-medium text-[#69756d]">
          Mehmaan Easy <span className="mx-2 text-[#bd604a]">·</span> Stay
          better. Book easier.
        </p>
      </section>
    </main>
  );
}
