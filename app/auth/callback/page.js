"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading, setRole } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setError("Sign-in could not be completed. Please try again.");
      return;
    }

    let active = true;
    async function finishSignIn() {
      const requestedRole = window.localStorage.getItem("pendingGoogleRole");
      try {
        if (requestedRole === "guest" || requestedRole === "host") {
          await setRole(requestedRole);
        }
        const pendingNext = window.localStorage.getItem("pendingGoogleNext");
        const destination =
          pendingNext?.startsWith("/") &&
          !pendingNext.startsWith("//") &&
          !pendingNext.includes("\\")
            ? pendingNext
            : "/dashboard";
        window.localStorage.removeItem("pendingGoogleRole");
        window.localStorage.removeItem("pendingGoogleNext");
        if (active) router.replace(destination);
      } catch (finishError) {
        if (active) setError(finishError.message || "Unable to finish creating your profile.");
      }
    }
    finishSignIn();
    return () => {
      active = false;
    };
  }, [loading, router, setRole, user]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-lg px-5 py-40 text-center text-cream">
        {error ? (
          <>
            <p role="alert" className="text-sm text-red-300">{error}</p>
            <button onClick={() => router.replace("/login")} className="mt-5 text-sm underline">
              Return to login
            </button>
          </>
        ) : (
          <p className="text-sm text-cream/70">Finishing secure sign-in…</p>
        )}
      </section>
    </main>
  );
}
