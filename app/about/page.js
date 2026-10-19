"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const values = [
  {
    number: "01",
    icon: ShieldCheck,
    title: "Care comes first",
    description:
      "We want every Mehmaan Easy stay to feel considered, comfortable, and cared for from the moment you arrive.",
  },
  {
    number: "02",
    icon: Heart,
    title: "Places with a point of view",
    description:
      "From a quiet apartment to a weekend home, we believe the right details can make a place feel memorable.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "A warmer welcome",
    description:
      "We’re building a more personal way for guests to discover homes and for hosts to share what they love.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />

      <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28">
        <div className="grid gap-10 md:grid-cols-2 md:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[360px] overflow-hidden rounded-[28px] sm:h-[480px]"
          >
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
              alt="A welcoming living room in a thoughtfully styled home"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15251f]/50 via-transparent to-transparent" />
            <span className="absolute bottom-6 left-6 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#34433b]">
              Stay better. Book easier.
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              Our story
            </p>
            <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#26322c] sm:text-6xl">
              A good stay
              <br />
              <span className="font-serif font-normal italic">
                stays with you.
              </span>
            </h1>
            <p className="mt-6 text-base leading-7 text-[#65716a]">
              Mehmaan Easy is being built around a simple idea: finding a place
              to stay should feel as welcoming as arriving there. We’re creating
              an India-first marketplace for thoughtful homes, warm hospitality,
              and easier getaways.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#758078]">
              Our goal is to help guests discover places with character and to
              give hosts practical support as they prepare their homes to
              welcome people.
            </p>
            <Link
              href="/properties"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#20372f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
            >
              Explore stays <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        <div className="mt-20 lg:mt-28">
          <div className="mb-9 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              What we believe
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#26322c] sm:text-4xl">
              The feeling is in the details.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map(({ number, icon: Icon, title, description }, index) => (
              <motion.article
                key={number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-[24px] border border-[#e8e7e1] bg-white p-7 transition-shadow hover:shadow-[0_14px_35px_rgba(32,45,37,0.08)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8eee8] text-[#bd604a]">
                    <Icon size={19} />
                  </span>
                  <span className="text-xs font-semibold tracking-[0.14em] text-[#a0a79f]">
                    {number}
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-semibold text-[#29352f]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#758078]">
                  {description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
