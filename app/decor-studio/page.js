"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, MoveUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const styles = [
  {
    name: "Coastal calm",
    mood: "Salt air, soft linen, slow mornings.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=90",
    colors: ["#d5c5ad", "#ebe5d8", "#718276", "#b7785d"],
    label: "01 / Goa",
  },
  {
    name: "The Jaipur edit",
    mood: "Old-world details with a fresh point of view.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1500&q=90",
    colors: ["#c8876c", "#e6c8ae", "#7d6754", "#e7dfcf"],
    label: "02 / Jaipur",
  },
  {
    name: "Modern earth",
    mood: "Natural textures and room to exhale.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=90",
    colors: ["#a9a18b", "#d4c9b7", "#5f6958", "#e9e4da"],
    label: "03 / Everywhere",
  },
  {
    name: "City cocoon",
    mood: "A little city energy, a lot of comfort.",
    image:
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1500&q=90",
    colors: ["#6d716c", "#c8b9a2", "#a66b51", "#e4dfd6"],
    label: "04 / Mumbai",
  },
];

export default function DecorStudioPage() {
  const [activeStyle, setActiveStyle] = useState(0);
  const style = styles[activeStyle];

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f8eee8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a94d39]">
              <Sparkles size={14} /> A little inspiration for your space
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Make room for
              <br />
              <span className="font-serif font-normal italic text-[#bd604a]">
                feeling at home.
              </span>
            </h1>
          </motion.div>
          <p className="max-w-lg text-base leading-7 text-[#707a73] lg:justify-self-end">
            A thoughtfully styled stay makes every arrival feel a little more
            special. Explore a few looks our team loves, then find a place that
            feels like you.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <motion.div
            key={style.name}
            initial={{ opacity: 0.7, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="group relative min-h-[420px] overflow-hidden rounded-[30px] bg-[#e7e3da] sm:min-h-[560px]"
          >
            <img
              src={style.image}
              alt={`${style.name} decor inspiration`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141b17]/80 via-transparent to-[#141b17]/10" />
            <div className="absolute left-5 top-5 rounded-full border border-white/35 bg-black/20 px-4 py-2 text-xs font-medium text-white backdrop-blur-md sm:left-7 sm:top-7">
              {style.label}
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-9 sm:left-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                The Mehmaan moodboard
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                {style.name}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/85 sm:text-base">
                {style.mood}
              </p>
            </div>
            <span className="absolute bottom-7 right-7 hidden h-12 w-12 items-center justify-center rounded-full bg-white text-[#26322c] sm:flex">
              <MoveUpRight size={20} />
            </span>
          </motion.div>

          <aside className="flex flex-col rounded-[30px] border border-[#e8e7e1] bg-white p-5 shadow-[0_16px_50px_rgba(32,45,37,0.06)] sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
                Find your feeling
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#26322c]">
                Pick a point of view.
              </h2>
            </div>
            <div className="mt-5 space-y-2">
              {styles.map((item, index) => (
                <motion.button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveStyle(index)}
                  aria-pressed={index === activeStyle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                    index === activeStyle
                      ? "border-[#bd604a]/40 bg-[#fcf5f1]"
                      : "border-transparent hover:bg-[#f7f5f1]"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#29352f]">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#758078]">
                      {item.mood}
                    </span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#bd604a] shadow-sm">
                    {index === activeStyle ? <Check size={15} /> : <MoveUpRight size={14} />}
                  </span>
                </motion.button>
              ))}
            </div>
            <div className="mt-auto border-t border-[#eeece7] pt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#758078]">
                This palette
              </p>
              <div className="flex items-center gap-2">
                {style.colors.map((color) => (
                  <span
                    key={color}
                    aria-label={`Palette color ${color}`}
                    className="h-9 flex-1 rounded-full border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Link
                href="/properties"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#20372f] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
              >
                Find a stay to match <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-5 border-t border-[#e8e7e1] pt-8 sm:grid-cols-3">
          {[
            ["Thoughtful details", "Local craft, layered textures, a sense of place."],
            ["Comfort comes first", "Beautiful spaces should feel easy to live in."],
            ["Made for real moments", "A morning coffee, a long lunch, one more day."],
          ].map(([title, detail], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex gap-4"
            >
              <span className="font-serif text-2xl italic text-[#bd604a]">
                0{index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#29352f]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#758078]">{detail}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
