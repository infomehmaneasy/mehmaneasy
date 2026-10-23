"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, MessageCircle, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { formatExperienceDuration } from "@/lib/experienceData";
import { openTawkChat } from "@/components/TawkChatWidget";

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/experiences/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load this experience.");
        if (active) setExperience(data.experience);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load this experience.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function askAboutExperience() {
    if (!openTawkChat()) setChatError("Live chat is still loading. Please try the chat button again in a moment.");
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
        <Link href="/experiences" className="inline-flex items-center gap-2 text-sm font-semibold text-[#526058] hover:text-[#bd604a]">
          <ArrowLeft size={16} /> All experiences
        </Link>
        {loading ? (
          <div className="mt-7 h-[420px] animate-pulse rounded-3xl bg-[#f0eee8]" />
        ) : error || !experience ? (
          <p role="alert" className="mt-8 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{error || "Experience not found."}</p>
        ) : (
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="grid gap-2 overflow-hidden rounded-[28px] bg-[#f0eee8] sm:grid-cols-[1.4fr_1fr]">
                <img src={experience.images?.[0]} alt={experience.title} className="h-[340px] w-full object-cover sm:h-[470px]" />
                <div className="hidden grid-cols-2 gap-2 sm:grid">
                  {experience.images?.slice(1, 5).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${experience.title} photo ${index + 2}`} className="h-[231px] w-full object-cover" />)}
                  {experience.images?.length === 1 && <div className="col-span-2 flex items-center justify-center text-sm text-[#758078]">More photos coming soon</div>}
                </div>
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">{experience.category}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{experience.title}</h1>
              <p className="mt-4 text-base leading-7 text-[#65716a]">{experience.summary}</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b border-[#e8e7e1] pb-6 text-sm text-[#526058]">
                <span className="inline-flex items-center gap-2"><MapPin size={17} />{experience.location}, {experience.city}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={17} />{formatExperienceDuration(experience.duration_hours)}</span>
                <span className="inline-flex items-center gap-2"><Users size={17} />Up to {experience.capacity} guests</span>
              </div>
              <section className="border-b border-[#e8e7e1] py-7">
                <h2 className="text-xl font-semibold">About this experience</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#65716a]">{experience.description}</p>
              </section>
              {experience.highlights?.length > 0 && (
                <section className="border-b border-[#e8e7e1] py-7">
                  <h2 className="text-xl font-semibold">Highlights</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {experience.highlights.map((item) => <li key={item} className="rounded-2xl bg-white p-4 text-sm text-[#526058]">✦ {item}</li>)}
                  </ul>
                </section>
              )}
              {experience.inclusions?.length > 0 && (
                <section className="border-b border-[#e8e7e1] py-7">
                  <h2 className="text-xl font-semibold">What&apos;s included</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {experience.inclusions.map((item) => <li key={item} className="text-sm text-[#526058]">✓ {item}</li>)}
                  </ul>
                </section>
              )}
              {experience.requirements && (
                <section className="py-7">
                  <h2 className="text-xl font-semibold">Before you go</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#65716a]">{experience.requirements}</p>
                </section>
              )}
            </div>
            <aside className="h-fit rounded-[24px] border border-[#e8e7e1] bg-white p-6 shadow-[0_12px_35px_rgba(32,45,37,0.08)] lg:sticky lg:top-28">
              <p className="text-2xl font-semibold">₹{Number(experience.price_per_person).toLocaleString("en-IN")}<span className="ml-1 text-sm font-normal text-[#65716a]"> / person</span></p>
              <p className="mt-3 text-sm leading-6 text-[#65716a]">Interested in this experience? Message our team for availability and details.</p>
              {chatError && <p role="alert" className="mt-3 text-xs text-[#8d392c]">{chatError}</p>}
              <button type="button" onClick={askAboutExperience} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#173b36] px-5 py-3 text-sm font-semibold text-white hover:bg-[#244d45]">
                <MessageCircle size={16} /> Chat with us
              </button>
              <p className="mt-4 text-center text-xs text-[#758078]">No payment is collected on this page.</p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
