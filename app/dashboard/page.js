"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/properties?ownerUid=${encodeURIComponent(user.uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your stays.");
      setListings((data.properties || []).map((item) => ({ ...item, id: item._id })));
    } catch (loadError) {
      console.error("Error loading host listings:", loadError);
      setError(loadError.message || "Unable to load your stays.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (user && profile?.verified) loadListings();
      else setLoading(false);
    }
  }, [authLoading, user, profile, loadListings]);

  async function setAvailability(property) {
    if (property.verificationStatus !== "approved") return;
    setBusyId(property.id);
    setError("");
    const status = property.status === "active" ? "inactive" : "active";
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update availability.");
      setListings((items) =>
        items.map((item) => (item.id === property.id ? { ...item, status } : item))
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update availability.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteListing(property) {
    if (!window.confirm(`Delete “${property.title}”? This cannot be undone.`)) return;
    setBusyId(property.id);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete this stay.");
      setListings((items) => items.filter((item) => item.id !== property.id));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete this stay.");
    } finally {
      setBusyId("");
    }
  }

  async function becomeHost() {
    setUpgrading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "host" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to activate host access.");
      await refreshProfile();
    } catch (upgradeError) {
      setError(upgradeError.message || "Unable to activate host access.");
    } finally {
      setUpgrading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#fffdf9]">
        <Navbar />
        <p className="pt-40 text-center text-sm text-[#65716a]">Loading your host dashboard…</p>
      </main>
    );
  }

  if (!user || !profile?.verified) {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <section className="mx-auto max-w-lg px-5 py-40 text-center">
          <h1 className="text-2xl font-semibold">
            {!user ? "Log in to continue" : "Verify your account"}
          </h1>
          <p className="mt-3 text-sm text-[#65716a]">
            {!user
              ? "Sign in to manage your Mehmaan Easy listings."
              : "Verify your email before managing host listings."}
          </p>
          <Link
            href={!user ? "/login" : "/verify"}
            className="mt-6 inline-flex rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white"
          >
            {!user ? "Log in" : "Verify email"}
          </Link>
        </section>
      </main>
    );
  }

  if (profile.role !== "host") {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <section className="mx-auto max-w-xl px-5 py-40 text-center">
          <h1 className="text-3xl font-semibold">Welcome to Mehmaan Easy</h1>
          <p className="mt-3 text-sm leading-6 text-[#65716a]">
            This is your guest account. If you own a property, switch on host
            access to prepare and submit a stay for verification.
          </p>
          {error && <p role="alert" className="mt-4 text-sm text-[#8d392c]">{error}</p>}
          <button
            type="button"
            disabled={upgrading}
            onClick={becomeHost}
            className="mt-6 rounded-full bg-[#20372f] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {upgrading ? "Setting up your host account…" : "Become a host"}
          </button>
        </section>
      </main>
    );
  }

  const pendingCount = listings.filter((listing) => listing.verificationStatus !== "approved").length;

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              Host dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Welcome, {profile.name?.split(" ")[0] || "host"}.
            </h1>
            <p className="mt-2 text-sm text-[#65716a]">
              Manage your property details and verification status.
            </p>
          </div>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
          >
            <Plus size={16} /> Add a stay
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total listings" value={listings.length} />
          <SummaryCard label="Awaiting review" value={pendingCount} />
          <SummaryCard
            label="Published"
            value={listings.filter((listing) => listing.verificationStatus === "approved" && listing.status === "active").length}
          />
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">
            {error}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-semibold">Your stays</h2>
          {listings.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#d8d5cc] bg-white px-6 py-14 text-center">
              <h3 className="text-lg font-semibold">Your first stay starts here</h3>
              <p className="mt-2 text-sm text-[#758078]">
                Add your property details and submit it for quality review.
              </p>
              <Link href="/post" className="mt-5 inline-flex text-sm font-semibold text-[#bd604a]">
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {listings.map((property) => (
                <motion.article
                  key={property.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 rounded-3xl border border-[#e8e7e1] bg-white p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <img
                    src={property.images?.[0] || "/logo.png"}
                    alt=""
                    className="h-48 w-full rounded-2xl object-cover sm:h-24 sm:w-32"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#29352f]">{property.title}</h3>
                      {property.verificationStatus === "approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5ef] px-2.5 py-1 text-[11px] font-semibold text-[#376247]">
                          <CheckCircle2 size={13} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5e8] px-2.5 py-1 text-[11px] font-semibold text-[#8b5a18]">
                          <Clock3 size={13} /> {property.verificationStatus || "Needs review"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#65716a]">
                      {property.propertyType || "Stay"} · {property.city} · Sleeps {property.capacity || 2}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#34433b]">
                      ₹{Number(property.price).toLocaleString("en-IN")} /{" "}
                      {property.priceBasis || (property.category === "Rental" ? "month" : "stay")}
                    </p>
                    {property.verificationNotes && (
                      <p className="mt-2 text-xs leading-5 text-[#9b503e]">
                        Improvement notes: {property.verificationNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      disabled={busyId === property.id || property.verificationStatus !== "approved"}
                      onClick={() => setAvailability(property)}
                      className="rounded-full border border-[#d8d9d2] px-3 py-2 text-xs font-semibold text-[#34433b] transition hover:bg-[#f7f5f1] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {property.verificationStatus !== "approved"
                        ? "Pending review"
                        : property.status === "active"
                          ? "Pause listing"
                          : "Make available"}
                    </button>
                    <Link
                      href={`/post?edit=${property.id}`}
                      aria-label={`Edit ${property.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d9d2] text-[#526058] hover:text-[#bd604a]"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === property.id}
                      onClick={() => deleteListing(property)}
                      aria-label={`Delete ${property.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5c6bb] text-[#8d392c] hover:bg-[#fff1ed] disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e8e7e1] bg-white p-5">
      <p className="text-xs font-medium text-[#758078]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#29352f]">{value}</p>
    </div>
  );
}
