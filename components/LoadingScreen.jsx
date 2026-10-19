"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const letters = "Mehmaan".split("");

export default function LoadingScreen({ onDone, minDuration = 600 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone && onDone();
    }, minDuration);
    return () => clearTimeout(t);
  }, [minDuration, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
        >
          <div className="absolute inset-0 bg-grain bg-[length:22px_22px]" />

          {/* Luggage tag */}
          <motion.div
            initial={{ y: -40, opacity: 0, rotate: -8 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mb-8"
          >
            <div className="animate-tag-swing">
              <div className="w-24 h-1 mx-auto bg-gold/60" style={{ clipPath: "polygon(48% 0, 52% 0, 100% 100%, 0 100%)" }} />
              <div className="relative w-28 h-20 rounded-lg border-2 border-gold bg-ink-panel shadow-ticket flex items-center justify-center">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-gold bg-ink" />
                <span className="font-script text-3xl text-gold-soft">Me</span>
              </div>
            </div>
          </motion.div>

          <div className="relative z-10 flex text-4xl md:text-5xl font-display font-800 tracking-tight">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                className="text-cream inline-block"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: "easeOut" }}
              >
                {l}
              </motion.span>
            ))}
            <motion.span
              className="font-script text-gold ml-2 text-4xl md:text-5xl"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
            >
              Easy
            </motion.span>
          </div>

          <motion.p
            className="relative z-10 mt-3 text-sm tracking-[0.3em] uppercase text-cream/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            Your next address, boarding now
          </motion.p>

          <motion.div
            className="relative z-10 mt-8 h-[2px] w-40 bg-ink-line overflow-hidden rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <motion.div
              className="h-full bg-gold"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
