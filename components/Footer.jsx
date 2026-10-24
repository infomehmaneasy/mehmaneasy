"use client";

import Link from "next/link";
import MaintenanceControlPanel from "@/components/MaintenanceControlPanel";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#073b38] py-12 text-white">
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-28 -right-8 h-56 w-56 rounded-full border border-white/10" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" aria-label="Mehmaan Easy home" className="flex w-fit items-center gap-3">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-base font-semibold tracking-[0.08em]">
                MEHMAAN<span className="font-serif italic text-[#d7bd84]">Easy</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">
              Beautiful stays. Brighter journeys.
              <br />A more thoughtful way to experience Goa.
            </p>
          </div>

          <FooterLinks title="Explore" links={[
            ["Stays", "/properties"],
            ["Experiences", "/experiences"],
            ["Décor Studio", "/decor-studio"],
          ]} />
          <FooterLinks title="Company" links={[
            ["About us", "/about"],
            ["List your property", "/post"],
            ["Your dashboard", "/dashboard"],
          ]} />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7bd84]">Plan your next stay</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Find a space that feels like yours, with a little help from our team.
            </p>
            <Link href="/properties" className="mt-4 inline-flex items-center rounded-full border border-white/25 px-4 py-2 text-xs font-semibold transition hover:border-[#d7bd84] hover:text-[#e8d5a9]">
              Browse stays <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Mehmaan Easy. All rights reserved.</p>
          <MaintenanceControlPanel triggerLabel="Thoughtfully hosted. Made for getting away." />
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7bd84]">{title}</h2>
      <nav className="mt-3 flex flex-col items-start gap-2 text-sm text-white/65">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition-colors hover:text-white">{label}</Link>
        ))}
      </nav>
    </div>
  );
}
