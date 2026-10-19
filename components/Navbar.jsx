"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [destination, setDestination] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    function updateScrollState() {
      setScrolled(window.scrollY > 100);
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function submitSearch(event) {
    event.preventDefault();
    const query = destination.trim()
      ? `?keyword=${encodeURIComponent(destination.trim())}`
      : "";
    router.push(`/properties${query}`);
    setOpen(false);
  }

  const isLight = !isHome || scrolled;
  const links = [
    { href: "/", label: "Discover" },
    { href: "/properties", label: "Find a stay" },
    { href: "/about", label: "Our story" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <motion.div
        animate={{
          y: scrolled ? 0 : 0,
          scale: scrolled ? 0.985 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto flex h-[68px] max-w-[1440px] items-center justify-between rounded-full px-4 transition-all duration-300 sm:h-[76px] sm:px-7 ${
          isLight
            ? "border border-[#e8e8e3] bg-white/95 text-[#27332d] shadow-[0_8px_30px_rgba(26,38,31,0.11)] backdrop-blur-xl"
            : "border border-white/20 bg-[#15251f]/25 text-white backdrop-blur-lg"
        }`}
      >
        <Link
          href="/"
          aria-label="Mehmaan Easy home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-9 rounded-xl object-contain"
          />
          <span className="hidden text-[17px] font-semibold tracking-[-0.04em] sm:inline">
            mehmaan<span className="text-[#bd604a]">easy</span>
          </span>
        </Link>

        <AnimatePresence mode="wait">
          {!scrolled && (
            <motion.nav
              key="main-navigation"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16 }}
              className="hidden items-center gap-7 md:flex"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? isLight
                        ? "text-[#bd604a]"
                        : "text-white"
                      : isLight
                        ? "text-[#65716a] hover:text-[#bd604a]"
                        : "text-white/85 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {scrolled && (
            <motion.form
              key="compact-search"
              onSubmit={submitSearch}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 hidden h-12 w-[min(390px,38vw)] -translate-x-1/2 items-center rounded-full border border-[#e7e7e2] bg-white pl-4 pr-1 shadow-[0_3px_14px_rgba(0,0,0,0.08)] md:flex"
            >
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Where to?  ·  Any dates  ·  Add guests"
                aria-label="Search destinations"
                className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#27332d] outline-none placeholder:text-[#65716a]"
              />
              <button
                type="submit"
                aria-label="Search stays"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#bd604a] text-white transition hover:bg-[#a94d39]"
              >
                <Search size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/post"
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              isLight
                ? "text-[#3c4941] hover:bg-[#f4f2ed]"
                : "text-white hover:bg-white/10"
            }`}
          >
            Become a host
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={user ? "Open account menu" : "Open sign in menu"}
              aria-expanded={open}
              className={`flex h-11 items-center gap-2 rounded-full border px-2.5 transition hover:shadow-md ${
                isLight
                  ? "border-[#e0e1dc] bg-white text-[#37443c]"
                  : "border-white/35 bg-white/10 text-white"
              }`}
            >
              {open ? <X size={17} /> : <Menu size={17} />}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3eee7] text-[#65716a]">
                <UserRound size={17} />
              </span>
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-[calc(100%+12px)] w-56 overflow-hidden rounded-2xl border border-[#e8e8e3] bg-white py-2 text-[#27332d] shadow-[0_16px_40px_rgba(26,38,31,0.18)]"
                >
                  {user ? (
                    <>
                      <p className="px-4 py-2 text-xs text-[#65716a]">
                        Signed in as{" "}
                        <span className="font-semibold text-[#27332d]">
                          {profile?.name || user.email}
                        </span>
                      </p>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
                      >
                        Your dashboard
                      </Link>
                      <Link
                        href="/post"
                        className="block px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
                      >
                        List your property
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setOpen(false);
                        }}
                        className="w-full border-t border-[#eeeeea] px-4 py-3 text-left text-sm transition hover:bg-[#f7f5f1]"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-sm font-semibold transition hover:bg-[#f7f5f1]"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
                      >
                        Sign up
                      </Link>
                      <Link
                        href="/post"
                        className="block border-t border-[#eeeeea] px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
                      >
                        List your property
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {scrolled && (
            <button
              type="button"
              onClick={() => router.push("/properties")}
              aria-label="Search stays"
              className="flex h-10 items-center gap-2 rounded-full border border-[#e8e8e3] px-3 text-xs font-medium"
            >
              <Search size={15} />
              Search stays
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${
              isLight ? "border-[#e0e1dc]" : "border-white/35"
            }`}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 -z-10 bg-black/20 md:hidden"
            />
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mx-auto mt-2 max-w-[1440px] rounded-3xl border border-[#e8e8e3] bg-white p-3 text-[#27332d] shadow-[0_16px_40px_rgba(26,38,31,0.18)] md:hidden"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-[#f7f5f1]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={user ? "/dashboard" : "/login"}
                className="block rounded-xl px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
              >
                {user ? "Your dashboard" : "Log in"}
              </Link>
              <Link
                href="/post"
                className="block rounded-xl px-4 py-3 text-sm transition hover:bg-[#f7f5f1]"
              >
                {user ? "List your property" : "Sign up to host"}
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#65716a] transition hover:bg-[#f7f5f1]"
                >
                  Sign out
                </button>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
