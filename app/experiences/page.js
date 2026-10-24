"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Compass,
  Flower2,
  Landmark,
  Leaf,
  MapPin,
  Mountain,
  Waves,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { formatExperienceDuration } from "@/lib/experienceData";
import { openTawkChat } from "@/components/TawkChatWidget";

const CATEGORY_DETAILS = [
  { name: "Water Adventures", detail: "Dive into Goa's waters", icon: Waves },
  { name: "Land Adventures", detail: "Take the scenic route", icon: Mountain },
  { name: "Nature & Wildlife", detail: "Find Goa's wild side", icon: Leaf },
  { name: "Cultural Experiences", detail: "Meet the local stories", icon: Landmark },
  { name: "Wellness & Relaxation", detail: "Make room to unwind", icon: Flower2 },
];

const FAQS = [
  ["How do I book an experience?", "Open an experience to see its details, then message our team to check availability and arrange your visit."],
  ["Are the experiences suitable for beginners?", "Each experience has its own requirements. Check the details or message us and we’ll help you find the right fit."],
  ["What is the cancellation policy?", "Cancellation terms vary by experience. Our team will confirm the applicable policy before your booking is finalised."],
  ["Do you offer private or group experiences?", "Many experiences can be arranged for private groups. Contact us with your preferred date and group size."],
];

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/experiences${query}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load experiences.");
        if (active) setExperiences(data.experiences || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load experiences.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const featuredExperiences = experiences.filter((item) => item.is_featured);
  const featured = (featuredExperiences.length ? featuredExperiences : experiences).slice(0, 3);
  const visibleCategories = category
    ? CATEGORY_DETAILS.filter((item) => item.name === category)
    : CATEGORY_DETAILS;

  function openChat() {
    if (!openTawkChat()) setChatError("Live chat is still loading. Please try again in a moment.");
  }

  return (
    <main className="min-h-screen bg-[#fbf8f1] text-[#173b36]">
      <Navbar />
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-28 sm:px-8 lg:px-12">
        <div className="relative flex min-h-[340px] items-center overflow-hidden rounded-[24px] bg-[#173b36] px-6 py-12 text-white sm:min-h-[420px] sm:px-12 lg:px-16">
          <img
            src={experiences[0]?.images?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2000&q=85"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#102f2c]/90 via-[#102f2c]/55 to-transparent" />
          <div className="relative max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#dfc58c]">
              Adventurous experiences
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-6xl">
              Explore more
              <br />than just stays
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">
              Thoughtful adventures, local culture and unforgettable moments for your Goa holiday.
            </p>
            <a href="#all-experiences" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#c39a50] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ad843f]">
              Browse experiences <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <nav aria-label="Experience categories" className="relative z-10 -mt-5 grid grid-cols-2 gap-2 rounded-[20px] bg-[#fffdfa] p-3 shadow-[0_12px_30px_rgba(32,45,37,0.09)] sm:grid-cols-3 lg:grid-cols-6">
          <CategoryButton active={!category} onClick={() => setCategory("")}>
            <Compass size={17} /> All experiences
          </CategoryButton>
          {CATEGORY_DETAILS.map(({ name, icon: Icon }) => (
            <CategoryButton key={name} active={category === name} onClick={() => setCategory(name)}>
              <Icon size={17} /> {name}
            </CategoryButton>
          ))}
        </nav>

        {error && <p role="alert" className="mt-8 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{error}</p>}
        {loading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-[#eeebe3]" />)}
          </div>
        ) : !error && experiences.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-[#d8d5cc] bg-white px-6 py-16 text-center">
            <Compass className="mx-auto text-[#9b804b]" size={28} />
            <h2 className="mt-4 font-serif text-2xl font-semibold">New experiences are on their way</h2>
            <p className="mt-2 text-sm text-[#65716a]">Please check back soon for a new adventure.</p>
          </div>
        ) : (
          <>
            {!category && featured.length > 0 && (
              <section className="pt-14">
                <SectionHeading eyebrow="Handpicked for you" title="Featured adventures" />
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((experience) => <ExperienceCard key={experience.id} experience={experience} featured />)}
                </div>
              </section>
            )}

            <div id="all-experiences" className="scroll-mt-28 space-y-12 pt-14">
              {visibleCategories.map(({ name, detail, icon: Icon }) => {
                const items = experiences.filter((experience) => experience.category === name);
                if (!items.length) return null;
                const shown = category ? items : items.slice(0, 4);
                return (
                  <section key={name}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0ede4] text-[#173b36]"><Icon size={22} /></span>
                        <div>
                          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{name}</h2>
                          <p className="mt-1 text-sm text-[#65716a]">{detail}</p>
                        </div>
                      </div>
                      {!category && items.length > 4 && (
                        <button type="button" onClick={() => setCategory(name)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d9d8d0] px-4 py-2 text-xs font-semibold text-[#34433b] transition hover:border-[#173b36]">
                          View all <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {shown.map((experience) => <ExperienceCard key={experience.id} experience={experience} compact />)}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        <section className="mt-16 overflow-hidden rounded-[22px] bg-[#173b36] px-6 py-9 text-white sm:px-10 sm:py-11">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#dfc58c]">Custom experiences</p>
              <h2 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">Looking for something special?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">We can curate a personalised experience based on your interests.</p>
            </div>
            <button type="button" onClick={openChat} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#c39a50] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ad843f]">
              Chat with us <ArrowRight size={16} />
            </button>
          </div>
          {chatError && <p role="alert" className="mt-3 text-xs text-[#ffe0d5]">{chatError}</p>}
        </section>

        <section className="grid gap-8 pt-14 lg:grid-cols-[1fr_340px]">
          <div>
            <SectionHeading eyebrow="A little more clarity" title="Frequently asked questions" />
            <div className="mt-5 divide-y divide-[#e8e4da]">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[#34433b]">
                    {question}<span className="text-lg text-[#65716a] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pt-3 text-sm leading-6 text-[#65716a]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="flex flex-col items-center justify-center rounded-[20px] bg-[#f1ecdf] px-6 py-8 text-center">
            <Compass size={27} className="text-[#9b804b]" />
            <h3 className="mt-4 font-serif text-2xl font-semibold">Need help planning?</h3>
            <p className="mt-2 text-sm leading-6 text-[#65716a]">Our team can help you find the right experience for your trip.</p>
            <button type="button" onClick={openChat} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#173b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24554d]">
              Message our team <ArrowRight size={15} />
            </button>
            {chatError && <p role="alert" className="mt-3 text-xs text-[#8d392c]">{chatError}</p>}
          </aside>
        </section>
      </section>
    </main>
  );
}

function CategoryButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[68px] flex-col items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-[11px] font-semibold transition ${
        active
          ? "bg-[#f3eee2] text-[#173b36] shadow-sm"
          : "text-[#526058] hover:bg-[#f7f5f0] hover:text-[#173b36]"
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9b804b]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.02em] text-[#173b36] sm:text-4xl">{title}</h2>
    </div>
  );
}

function ExperienceCard({ experience, featured = false, compact = false }) {
  return (
    <Link
      href={`/experience/${experience.id}`}
      className="group min-w-0 overflow-hidden rounded-[16px] bg-[#fffdfa] shadow-[0_5px_20px_rgba(32,45,37,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(32,45,37,0.12)]"
    >
      <div className={`relative overflow-hidden bg-[#e9eee9] ${compact ? "aspect-[1.5]" : "aspect-[1.45]"}`}>
        {experience.images?.[0] && <img src={experience.images[0]} alt={experience.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />}
        {(featured || experience.is_featured) && <span className="absolute right-3 top-3 rounded-full bg-[#fffdfa]/95 px-3 py-1 text-[10px] font-semibold text-[#34433b]">Popular</span>}
      </div>
      <div className="p-4">
        {!compact && <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b804b]">{experience.category}</p>}
        <h3 className="mt-1 font-serif text-lg font-semibold text-[#173b36]">{experience.title}</h3>
        {!compact && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#65716a]">{experience.summary}</p>}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-[#65716a]">
          <span className="inline-flex items-center gap-1"><Clock3 size={12} />{formatExperienceDuration(experience.duration_hours)}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{experience.city}</span>
          {featured && <span className="inline-flex items-center gap-1"><Users size={12} />Up to {experience.capacity}</span>}
        </div>
        <p className="mt-3 text-xs font-semibold text-[#173b36]">
          From ₹{Number(experience.price_per_person).toLocaleString("en-IN")}
          {featured && <span className="font-normal text-[#65716a]"> / person</span>}
        </p>
      </div>
    </Link>
  );
}
