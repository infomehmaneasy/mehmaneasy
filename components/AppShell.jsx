"use client";

import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import SupabaseSetupNotice from "@/components/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import Lenis from "lenis";
import MaintenanceControlPanel from "@/components/MaintenanceControlPanel";

export default function AppShell({ children }) {
  const [ready, setReady] = useState(false);
  const [maintenance, setMaintenance] = useState(null);
  const [developerAuthorized, setDeveloperAuthorized] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      try {
        const [availabilityResponse, accessResponse] = await Promise.all([
          fetch("/api/maintenance", { cache: "no-store" }),
          fetch("/api/maintenance/access", { cache: "no-store" }),
        ]);
        const [availabilityData, accessData] = await Promise.all([
          availabilityResponse.json(),
          accessResponse.json(),
        ]);
        if (!availabilityResponse.ok) {
          throw new Error(availabilityData.error || "Unable to check site availability.");
        }
        if (!accessResponse.ok) {
          throw new Error(accessData.error || "Unable to verify developer access.");
        }
        if (active) {
          setMaintenance(availabilityData.maintenance || { enabled: false, message: "" });
          setDeveloperAuthorized(Boolean(accessData.authorized));
          setAvailabilityChecked(true);
        }
      } catch (error) {
        console.error("Unable to check site availability:", error);
        if (active) {
          setMaintenance({
            enabled: true,
            message: "We’re temporarily unable to verify site availability. Please try again shortly.",
          });
          setDeveloperAuthorized(false);
          setAvailabilityChecked(true);
        }
      }
    }
    loadAvailability();
    const refreshAvailability = () => loadAvailability();
    window.addEventListener("mehmaan-easy:maintenance-updated", refreshAvailability);
    return () => {
      active = false;
      window.removeEventListener("mehmaan-easy:maintenance-updated", refreshAvailability);
    };
  }, []);

  useEffect(() => {
    if (ready) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, [ready]);

  if (!isSupabaseConfigured) {
    return <SupabaseSetupNotice />;
  }

  if (!availabilityChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8f1] px-5 text-[#59665f]">
        <p role="status" className="text-sm">Checking website availability…</p>
      </main>
    );
  }

  if (maintenance?.enabled && !developerAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8f1] px-5 py-16 text-[#173b36]">
        <section className="w-full max-w-xl rounded-[28px] border border-[#e6e1d5] bg-white p-8 text-center shadow-[0_20px_70px_rgba(23,59,54,0.12)] sm:p-12">
          <img src="/logo.png" alt="" className="mx-auto h-14 w-14 rounded-2xl object-contain" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b804b]">
            Mehmaan Easy
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">We’ll be back soon</h1>
          <p className="mt-4 text-sm leading-6 text-[#59665f]">{maintenance.message}</p>
          <div className="mt-7 flex justify-center">
            <MaintenanceControlPanel triggerLabel="Developer maintenance controls" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <LoadingScreen onDone={() => setReady(true)} />
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease" }} className="flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
        <Footer />
      </div>
    </>
  );
}
