"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e8e7e1] bg-[#f7f5f0] py-10 text-[#34433b]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8 lg:px-12">
        <Link href="/" aria-label="Mehmaan Easy home" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-sm font-semibold tracking-[-0.03em]">
            mehmaan<span className="text-[#bd604a]">easy</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#65716a]">
          <Link href="/" className="transition-colors hover:text-[#bd604a]">
            All
          </Link>
          <Link
            href="/properties"
            className="transition-colors hover:text-[#bd604a]"
          >
            Stays
          </Link>
          <Link
            href="/experiences"
            className="transition-colors hover:text-[#bd604a]"
          >
            Experiences
          </Link>
          <Link
            href="/decor-studio"
            className="transition-colors hover:text-[#bd604a]"
          >
            Décor Studio
          </Link>
          <Link href="/about" className="transition-colors hover:text-[#bd604a]">
            Our story
          </Link>
          <Link href="/post" className="transition-colors hover:text-[#bd604a]">
            Become a host
          </Link>
        </nav>

        <p className="text-xs text-[#758078]">
          © {currentYear} Mehmaan Easy. Stay better. Book easier.
        </p>
      </div>
    </footer>
  );
}
