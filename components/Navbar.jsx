"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const { user, profile, signOut, setRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("guest");
  const [modeError, setModeError] = useState("");
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

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem("mehmaan-easy:view-mode");
      setActiveMode(savedMode === "host" || savedMode === "guest"
        ? savedMode
        : profile?.role === "host" ? "host" : "guest");
    } catch (error) {
      console.error("Unable to load the saved workspace mode:", error);
      setActiveMode(profile?.role === "host" ? "host" : "guest");
    }
  }, [profile?.role]);

  async function switchMode() {
    const nextMode = activeMode === "host" ? "guest" : "host";
    setModeError("");
    if (nextMode === "host" && !user) {
      toggleTheme();
      setActiveMode(nextMode);
      router.push("/post");
      return;
    }

    try {
      if (nextMode === "host" && profile?.role === "guest") {
        await setRole("host");
      }
      window.localStorage.setItem("mehmaan-easy:view-mode", nextMode);
      setActiveMode(nextMode);
      toggleTheme();
      router.push(nextMode === "host" ? "/dashboard" : "/properties");
    } catch (error) {
      setModeError(error.message || "Unable to switch workspace.");
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("keyword", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guestCount);
    router.push(`/properties?${params.toString()}`);
    setOpen(false);
    setMobileSearchOpen(false);
  }

  const isLight = (!isHome || scrolled) && theme !== "dark";
  const links = [
    { href: "/", label: "All" },
    { href: "/properties", label: "Stays" },
    { href: "/experiences", label: "Experiences" },
    { href: "/decor-studio", label: "Décor Studio" },
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
              className="absolute left-1/2 hidden h-14 w-[min(610px,52vw)] -translate-x-1/2 items-center rounded-full border border-[#e7e7e2] bg-white px-2 text-[#27332d] shadow-[0_3px_14px_rgba(0,0,0,0.08)] xl:flex"
            >
              <label className="min-w-0 flex-[1.2] px-3">
                <span className="block text-[10px] font-semibold text-[#27332d]">Where to?</span>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Search destinations"
                  aria-label="Search destination"
                  className="w-full bg-transparent text-[11px] text-[#526058] outline-none placeholder:text-[#87918a]"
                />
              </label>
              <label className="min-w-0 flex-1 border-l border-[#e8e7e1] px-3">
                <span className="block text-[10px] font-semibold text-[#27332d]">Check in</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  aria-label="Check-in date"
                  className="w-full bg-transparent text-[10px] text-[#526058] outline-none [color-scheme:light]"
                />
              </label>
              <label className="min-w-0 flex-1 border-l border-[#e8e7e1] px-3">
                <span className="block text-[10px] font-semibold text-[#27332d]">Check out</span>
                <input
                  type="date"
                  min={checkIn || undefined}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  aria-label="Check-out date"
                  className="w-full bg-transparent text-[10px] text-[#526058] outline-none [color-scheme:light]"
                />
              </label>
              <label className="min-w-0 flex-1 border-l border-[#e8e7e1] px-3">
                <span className="block text-[10px] font-semibold text-[#27332d]">Guests</span>
                <select
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  aria-label="Number of guests"
                  className="w-full bg-transparent text-[11px] text-[#526058] outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>
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
          {!scrolled && (
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Plan your stay"
              className="hidden h-10 items-center gap-2 rounded-full border border-current/20 px-4 text-xs font-medium xl:flex"
            >
              <Search size={15} />
              Plan your stay
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Plan your stay"
            className="flex h-10 items-center gap-2 rounded-full border border-current/20 px-4 text-xs font-medium xl:hidden"
          >
            <Search size={15} />
            Plan your stay
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              isLight
                ? "border-[#e0e1dc] text-[#3c4941] hover:bg-[#f4f2ed]"
                : "border-white/35 text-white hover:bg-white/10"
            }`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user ? (
          <button
            type="button"
            onClick={switchMode}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              isLight
                ? "text-[#3c4941] hover:bg-[#f4f2ed]"
                : "text-white hover:bg-white/10"
            }`}
          >
            {activeMode === "host" ? "Switch to guest" : "Switch to host"}
          </button>
          ) : (
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
          )}
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
                      {modeError && <p role="alert" className="px-4 py-2 text-xs text-[#8d392c]">{modeError}</p>}
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
                        onClick={switchMode}
                        className="w-full border-t border-[#eeeeea] px-4 py-3 text-left text-sm transition hover:bg-[#f7f5f1]"
                      >
                        Switch to {activeMode === "host" ? "guest" : "host"} mode
                      </button>
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
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${
              isLight ? "border-[#e0e1dc]" : "border-white/35"
            }`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Plan your stay"
            title="Plan your stay"
            className="flex h-10 items-center gap-2 rounded-full border border-current/20 px-3 text-xs font-medium"
          >
            <Search size={15} />
            {scrolled && <span>Search</span>}
          </button>
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
        {mobileSearchOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close stay search"
              onClick={() => setMobileSearchOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#0e1713]/65 backdrop-blur-sm"
            />
            <motion.form
              onSubmit={submitSearch}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="fixed left-4 right-4 top-24 z-50 mx-auto grid max-w-xl gap-3 rounded-[28px] border border-white/15 bg-[#17231e] p-5 text-white shadow-2xl"
            >
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f0b39d]">Plan your stay</p>
                  <h2 className="mt-1 text-xl font-semibold">Where are you headed?</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  aria-label="Close search"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80"
                >
                  <X size={17} />
                </button>
              </div>
              <label className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <MapPin size={14} className="text-[#f0b39d]" /> Where to?
                </span>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Search destinations"
                  aria-label="Search destination"
                  className="mt-2 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
                  <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                    <CalendarDays size={14} className="text-[#f0b39d]" /> Check in
                  </span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    aria-label="Check-in date"
                    className="mt-2 w-full bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                </label>
                <label className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
                  <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                    <CalendarDays size={14} className="text-[#f0b39d]" /> Check out
                  </span>
                  <input
                    type="date"
                    min={checkIn || undefined}
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    aria-label="Check-out date"
                    className="mt-2 w-full bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                  />
                </label>
              </div>
              <label className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
                <span className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
                  <Users size={14} className="text-[#f0b39d]" /> Guests
                </span>
                <select
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  aria-label="Number of guests"
                  className="mt-2 w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#bd604a] text-sm font-semibold text-white transition hover:bg-[#a94d39]"
              >
                <Search size={16} /> Search stays
              </button>
            </motion.form>
          </>
        )}
      </AnimatePresence>

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
                  onClick={switchMode}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm transition hover:bg-[#f7f5f1]"
                >
                  Switch to {activeMode === "host" ? "guest" : "host"} mode
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm transition hover:bg-[#f7f5f1]"
              >
                Switch to {theme === "dark" ? "light" : "dark"} theme
              </button>
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
