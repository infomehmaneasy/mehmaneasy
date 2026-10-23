"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { EXPERIENCE_CATEGORIES, formatExperienceDuration } from "@/lib/experienceData";

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[32px] bg-[#173b36] px-7 py-14 text-white sm:px-12 sm:py-20">
          {experiences[0]?.images?.[0] && (
            <img
              src={experiences[0].images[0]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#123b36]/95 via-[#123b36]/70 to-transparent" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ead29a]">
              More than a stay
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
              Explore experiences
              <br />that stay with you.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              Discover thoughtful adventures, local culture, and memorable moments
              curated by Mehmaan Easy.
            </p>
            <a href="#all-experiences" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ead29a] px-5 py-3 text-sm font-semibold text-[#183a34]">
              Browse experiences <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div id="all-experiences" className="scroll-mt-28 pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
                Made for curious travellers
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Find your kind of adventure</h2>
            </div>
            <p className="text-sm text-[#65716a]">
              {experiences.length} {experiences.length === 1 ? "experience" : "experiences"}
            </p>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            <CategoryButton active={!category} onClick={() => setCategory("")}>All experiences</CategoryButton>
            {EXPERIENCE_CATEGORIES.map((item) => (
              <CategoryButton key={item} active={category === item} onClick={() => setCategory(item)}>
                {item}
              </CategoryButton>
            ))}
          </div>

          {error && <p role="alert" className="mt-8 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{error}</p>}
          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-3xl bg-[#f0eee8]" />)}
            </div>
          ) : !error && experiences.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[#d8d5cc] bg-white px-6 py-16 text-center">
              <Sparkles className="mx-auto text-[#bd604a]" size={28} />
              <h3 className="mt-4 text-lg font-semibold">New experiences are on their way</h3>
              <p className="mt-2 text-sm text-[#65716a]">Please check back soon for a new adventure.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map((experience) => (
                <Link
                  href={`/experience/${experience.id}`}
                  key={experience.id}
                  className="group overflow-hidden rounded-3xl border border-[#e8e7e1] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(32,45,37,0.12)]"
                >
                  <div className="relative h-64 bg-[#e9eee9]">
                    {experience.images?.[0] && <img src={experience.images[0]} alt={experience.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
                    {experience.is_featured && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#34433b]">Featured</span>}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#bd604a]">{experience.category}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#29352f]">{experience.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#65716a]">{experience.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#65716a]">
                      <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{experience.location}, {experience.city}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{formatExperienceDuration(experience.duration_hours)}</span>
                      <span className="inline-flex items-center gap-1.5"><Users size={14} />Up to {experience.capacity}</span>
                    </div>
                    <p className="mt-5 border-t border-[#eeeeea] pt-4 text-sm font-semibold text-[#20372f]">
                      From ₹{Number(experience.price_per_person).toLocaleString("en-IN")}
                      <span className="font-normal text-[#65716a]"> / person</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
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
      className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
        active
          ? "border-[#173b36] bg-[#173b36] text-white"
          : "border-[#e0e1dc] bg-white text-[#526058] hover:border-[#bd604a]"
      }`}
    >
      {children}
    </button>
  );
}
