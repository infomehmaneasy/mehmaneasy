"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  House,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { DEFAULT_SITE_MEDIA } from "@/lib/siteMedia";

const COLLECTIONS = [
  {
    name: "Classic",
    description: "Thoughtful homes with timeless comfort.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85",
    icon: House,
    tone: "#f0eadc",
  },
  {
    name: "Easy",
    description: "Relaxed stays for easy-going getaways.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85",
    icon: Leaf,
    tone: "#edf0e8",
  },
  {
    name: "Royal",
    description: "Exceptional spaces for a special escape.",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1100&q=85",
    icon: Crown,
    tone: "#f1e9dc",
  },
];

const DESTINATIONS = [
  {
    name: "North Goa",
    detail: "Beach days & lively nights",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "South Goa",
    detail: "Quiet shores & slow mornings",
    image:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Candolim",
    detail: "A little bit of everything",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Arambol",
    detail: "Clifftop views & sunsets",
    image:
      "https://images.unsplash.com/photo-1473116763249-2fee01ff3a91?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Assagao",
    detail: "Village charm & greenery",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Mumbai",
    detail: "City energy & coastal escapes",
    image:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=85",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [activeCollection, setActiveCollection] = useState("All");
  const [siteMedia, setSiteMedia] = useState(DEFAULT_SITE_MEDIA);

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/properties");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load stays.");
        if (active) setProperties(data.properties || []);
      } catch (error) {
        console.error("Unable to load the stay collection:", error);
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unable to load stays.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProperties();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/site-media")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load discovery images.");
        if (active && data.media) {
          setSiteMedia({
            collections: { ...DEFAULT_SITE_MEDIA.collections, ...data.media.collections },
            destinations: { ...data.media.destinations },
          });
        }
      })
      .catch((error) => {
        console.error("Unable to load managed discovery images:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("keyword", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    if (activeCollection !== "All") params.set("stayTier", activeCollection);
    router.push(`/properties?${params.toString()}`);
  }

  const displayedProperties =
    activeCollection === "All"
      ? properties
      : properties.filter((property) => property.stayTier === activeCollection);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf8f1] text-[#173b36]">
      <Navbar />

      <section className="bg-[#fbf8f1] pb-7 pt-[68px] sm:pb-10">
        <div className="mx-auto grid max-w-[1440px] md:min-h-[510px] md:grid-cols-[0.82fr_1.18fr] lg:min-h-[570px]">
          <div className="flex flex-col justify-center px-5 pb-7 pt-12 sm:px-10 md:py-12 lg:px-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b804b]">
              Goa and beyond
            </p>
            <h1 className="mt-4 max-w-[520px] font-serif text-[42px] font-medium leading-[0.98] tracking-[-0.035em] text-[#173b36] sm:text-6xl lg:text-[70px]">
              Stays that
              <br />
              <span className="italic text-[#9b804b]">feel like home.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#59665f] sm:text-base sm:leading-7">
              Beautiful homes, unique stays and thoughtful experiences for every journey.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-[#66736b]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#9b804b]" />
                Thoughtfully selected stays
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#9b804b]" />
                Hospitality with care
              </span>
            </div>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-l-[130px] sm:min-h-[360px] sm:rounded-l-[180px] md:min-h-0 md:rounded-l-[190px]">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=90"
              alt="A tropical villa with a sunlit pool"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102f2c]/25 to-transparent" />
            <span className="absolute bottom-5 right-5 rounded-full border border-white/45 bg-white/15 px-4 py-2 text-[10px] font-medium tracking-wide text-white backdrop-blur-sm">
              More than a stay
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-5 max-w-[1200px] px-4 sm:px-8 md:-mt-8">
          <form
            onSubmit={submitSearch}
            className="grid gap-2 rounded-[24px] border border-[#ece8df] bg-white p-2 shadow-[0_14px_40px_rgba(32,45,37,0.14)] sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-center lg:rounded-full"
          >
            <label className="flex min-h-14 items-center gap-3 rounded-2xl px-4 hover:bg-[#f8f6f1] lg:rounded-full">
              <MapPin size={17} className="shrink-0 text-[#173b36]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#34433b]">
                  Where
                </span>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Goa, India"
                  aria-label="Where are you going?"
                  className="w-full bg-transparent text-xs text-[#26322c] outline-none placeholder:text-[#828b84]"
                />
              </span>
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-2xl px-4 hover:bg-[#f8f6f1] lg:border-l lg:border-[#ece8df] lg:rounded-none">
              <CalendarDays size={17} className="shrink-0 text-[#173b36]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#34433b]">
                  Check in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  aria-label="Check-in date"
                  className="w-full bg-transparent text-xs text-[#526058] outline-none [color-scheme:light]"
                />
              </span>
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-2xl px-4 hover:bg-[#f8f6f1] lg:border-l lg:border-[#ece8df] lg:rounded-none">
              <CalendarDays size={17} className="shrink-0 text-[#173b36]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#34433b]">
                  Check out
                </span>
                <input
                  type="date"
                  min={checkIn || undefined}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  aria-label="Check-out date"
                  className="w-full bg-transparent text-xs text-[#526058] outline-none [color-scheme:light]"
                />
              </span>
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-2xl px-4 hover:bg-[#f8f6f1] lg:border-l lg:border-[#ece8df] lg:rounded-none">
              <Users size={17} className="shrink-0 text-[#173b36]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#34433b]">
                  Guests
                </span>
                <select
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  aria-label="Number of guests"
                  className="w-full bg-transparent text-xs text-[#526058] outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </span>
            </label>
            <button
              type="submit"
              aria-label="Search stays"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#073b38] px-6 text-sm font-semibold text-white transition hover:bg-[#14534e] lg:mr-1 lg:h-12 lg:w-12 lg:px-0"
            >
              <Search size={17} />
              <span className="lg:hidden">Search stays</span>
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-8 pt-4 sm:px-8 lg:px-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9b804b]">Find your kind of stay</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.025em] text-[#173b36] sm:text-3xl">
              The Mehmaan collections
            </h2>
          </div>
          <Link href="/properties" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#34433b] hover:text-[#9b804b]">
            See all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {COLLECTIONS.map(({ name, description, image, icon: Icon, tone }) => (
            <Link
              key={name}
              href={`/properties?stayTier=${name}`}
              data-collection-card
              style={{ backgroundColor: tone }}
              className="group relative flex min-h-[118px] items-center overflow-hidden rounded-[18px] sm:min-h-[150px]"
            >
              <div className="relative z-10 max-w-[64%] p-5 sm:p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#173b36]">
                  <Icon size={17} />
                </span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-[#173b36] sm:text-2xl">{name}</h3>
                <p className="mt-1 text-[11px] leading-4 text-[#59665f]">{description}</p>
              </div>
              <img
                src={siteMedia.collections[name] || image}
                alt=""
                loading="lazy"
                className="absolute right-0 top-0 h-full w-[42%] object-cover transition-transform duration-500 group-hover:scale-105 sm:w-[48%]"
              />
              <div
                data-collection-fade
                className="absolute inset-y-0 left-[40%] w-[20%]"
                style={{ backgroundImage: `linear-gradient(90deg, ${tone}, transparent)` }}
              />
              <span className="absolute bottom-4 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#173b36] shadow-sm sm:right-4">
                <ChevronRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <SectionHeading eyebrow="Goa, your way" title="Discover your next escape" href="/properties" linkText="All destinations" />
        <div className="hide-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4">
          {Object.entries(siteMedia.destinations).map(([name, image]) => {
            const place = DESTINATIONS.find((destination) => destination.name === name);
            return (
              <button
                type="button"
                key={name}
                onClick={() => router.push(`/properties?keyword=${encodeURIComponent(name)}`)}
                className="group relative h-[150px] w-[42vw] max-w-[230px] shrink-0 snap-start overflow-hidden rounded-[18px] text-left sm:h-[190px] sm:w-[210px]"
              >
                <img src={image || place?.image || "/logo.png"} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="block font-serif text-lg font-semibold sm:text-xl">{name}</span>
                  <span className="mt-0.5 block text-[10px] text-white/85 sm:text-xs">
                    {place?.detail || "Discover stays and local highlights"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12">
        <div className="rounded-[22px] border border-[#e7e2d8] bg-white/75 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b804b]">
                Stay easy
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#173b36] sm:text-3xl">
                Book your stay in three simple steps
              </h2>
            </div>
            <Link
              href="/properties"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#073b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#0b514c]"
            >
              Find your stay <ArrowRight size={14} />
            </Link>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {[
              ["01", "Choose where", "Pick a destination or collection that feels right."],
              ["02", "Choose your stay", "Compare real photos, prices and the details that matter."],
              ["03", "Send a request", "Choose your dates and ask the host to confirm. No online payment."],
            ].map(([number, title, detail]) => (
              <li key={number} className="flex gap-3 rounded-2xl bg-[#fbf8f1] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9e2d2] text-xs font-bold text-[#765d32]">
                  {number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#173b36]">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#65716a]">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {["All", ...COLLECTIONS.map((collection) => collection.name)].map((tier) => (
            <button
              key={tier}
              type="button"
              aria-pressed={activeCollection === tier}
              onClick={() => setActiveCollection(tier)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                activeCollection === tier
                  ? "border-[#073b38] bg-[#073b38] text-white"
                  : "border-[#dedbd2] bg-white text-[#526058] hover:border-[#9b804b]"
              }`}
            >
              {tier === "All" ? "Handpicked stays" : `${tier} stays`}
            </button>
          ))}
        </div>

        {loadError ? (
          <div role="alert" className="rounded-2xl border border-[#ead9d0] bg-white p-5 text-sm text-[#8d392c]">{loadError}</div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[0.9] animate-pulse rounded-2xl bg-[#eeebe3]" />)}
          </div>
        ) : displayedProperties.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {displayedProperties.slice(0, 8).map((property, index) => (
              <PropertyCard key={property.id || property._id} property={property} index={index} compact />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d8d5cc] bg-white/70 px-5 py-12 text-center">
            <House className="mx-auto text-[#9b804b]" size={25} />
            <h3 className="mt-3 font-serif text-xl font-semibold text-[#173b36]">
              {activeCollection === "All" ? "New stays are on their way" : `${activeCollection} stays are coming soon`}
            </h3>
            <p className="mt-1 text-xs text-[#65716a]">Explore another collection or check back soon.</p>
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href="/properties" className="inline-flex items-center gap-2 rounded-full border border-[#c9ccc5] px-5 py-2.5 text-xs font-semibold text-[#34433b] transition hover:border-[#073b38] hover:bg-white">
            Explore all stays <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid overflow-hidden rounded-[22px] bg-[#073b38] text-white md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[220px] sm:min-h-[300px]">
            <img src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=85" alt="A quiet Goa sunset by the sea" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#073b38]/50 md:bg-gradient-to-l" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#dfc58c]">More than a stay</p>
            <h2 className="mt-2 font-serif text-3xl font-medium leading-tight sm:text-4xl">Thoughtful experiences</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/75">From beach adventures to cultural finds, discover a more meaningful way to travel.</p>
            <Link href="/experiences" className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#073b38] transition hover:bg-[#f1e9dc]">
              Explore experiences <Waves size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-14 pt-8 sm:px-8 lg:px-12">
        <div className="grid items-center gap-6 overflow-hidden rounded-[22px] bg-[#efe9db] p-6 sm:p-9 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9b804b]">Become a host</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#173b36] sm:text-4xl">List your property on Mehmaan Easy</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#59665f]">Join our community of hosts and welcome travellers looking for their next favourite stay.</p>
          </div>
          <Link href="/post" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#073b38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#14534e]">
            Become a host <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ eyebrow, title, href, linkText }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b804b]">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.025em] text-[#173b36] sm:text-3xl">{title}</h2>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#34433b] hover:text-[#9b804b]">
        {linkText} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
