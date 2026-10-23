"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingPanel from "@/components/BookingPanel";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function DashboardPage() {
  const { user, profile, profileError, loading: authLoading, refreshProfile, setRole, getAccessToken } = useAuth();
  const { toggleTheme } = useTheme();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [hostBookings, setHostBookings] = useState([]);
  const [hostBookingsLoading, setHostBookingsLoading] = useState(true);
  const [hostBookingsError, setHostBookingsError] = useState("");
  const [hostBookingsRefreshing, setHostBookingsRefreshing] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/properties?ownerUid=${encodeURIComponent(user.id)}`, {
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
  }, [getAccessToken, user]);

  const loadHostBookings = useCallback(async (refresh = false) => {
    if (!user) {
      setHostBookingsLoading(false);
      return;
    }
    if (refresh) setHostBookingsRefreshing(true);
    else setHostBookingsLoading(true);
    setHostBookingsError("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load booking requests.");
      setHostBookings(data.bookings || []);
    } catch (loadError) {
      console.error("Error loading host booking requests:", loadError);
      setHostBookingsError(loadError.message || "Unable to load booking requests.");
    } finally {
      setHostBookingsLoading(false);
      setHostBookingsRefreshing(false);
    }
  }, [getAccessToken, user]);

  useEffect(() => {
    if (!authLoading) {
      if (user && profile) {
        if (profile.role === "host" || profile.role === "admin") {
          loadListings();
          loadHostBookings();
        } else {
          setLoading(false);
        }
      } else setLoading(false);
    }
  }, [authLoading, user, profile, loadListings, loadHostBookings]);

  async function setAvailability(property) {
    if (property.verificationStatus !== "approved") return;
    setBusyId(property.id);
    setError("");
    const status = property.status === "active" ? "inactive" : "active";
    try {
      const token = await getAccessToken();
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
      const token = await getAccessToken();
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
      const token = await getAccessToken();
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
      try {
        window.localStorage.setItem("mehmaan-easy:view-mode", "host");
      } catch (storageError) {
        console.error("Unable to save the host workspace preference:", storageError);
      }
      toggleTheme();
    } catch (upgradeError) {
      setError(upgradeError.message || "Unable to activate host access.");
    } finally {
      setUpgrading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#fffdf9]">
        <Navbar />
        <p className="pt-40 text-center text-sm text-[#65716a]">Loading your host dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <section className="mx-auto max-w-lg px-5 py-40 text-center">
          <h1 className="text-2xl font-semibold">Log in to continue</h1>
          <p className="mt-3 text-sm text-[#65716a]">
            Sign in to manage your Mehmaan Easy listings.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white"
          >
            Log in
          </Link>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <section className="mx-auto max-w-lg px-5 py-40 text-center">
          <h1 className="text-2xl font-semibold">Your account is still loading</h1>
          <p className="mt-3 text-sm text-[#65716a]">
            {profileError || "Refresh the page to retry loading your profile."}
          </p>
          <button
            type="button"
            onClick={() => refreshProfile().catch((refreshError) => setError(refreshError.message))}
            className="mt-5 rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  if (profile.role !== "host" && profile.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
        <Navbar />
        <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">Guest dashboard</p>
              <h1 className="text-3xl font-semibold">Welcome, {profile.name?.split(" ")[0] || "traveller"}.</h1>
              <p className="mt-2 text-sm text-[#65716a]">Manage booking requests and your upcoming stays.</p>
            </div>
            <button
              type="button"
              disabled={upgrading}
              onClick={becomeHost}
              className="rounded-full border border-[#d8d9d2] px-5 py-3 text-sm font-semibold text-[#34433b] disabled:opacity-50"
            >
              {upgrading ? "Setting up…" : "Become a host"}
            </button>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-[#8d392c]">{error}</p>}
          <BookingPanel
            direction="guest"
            title="Your trips"
            emptyTitle="No trips yet"
            emptyDetail="When you request a stay, you can track the host response here."
          />
        </section>
      </main>
    );
  }

  const pendingCount = listings.filter((listing) => listing.verificationStatus !== "approved").length;
  const isAdmin = profile.role === "admin";

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
              {isAdmin ? "Admin host workspace" : "Host dashboard"}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Welcome, {profile.name?.split(" ")[0] || "host"}.
            </h1>
            <p className="mt-2 text-sm text-[#65716a]">
              {isAdmin
                ? "Your admin account can also host. Manage your listings and guest bookings here."
                : "Manage your property details and verification status."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Link href="/admin" className="rounded-full border border-[#d8d9d2] px-5 py-3 text-sm font-semibold text-[#34433b]">
                Admin workspace
              </Link>
            )}
            <Link
              href="/post"
              className="inline-flex items-center gap-2 rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d4a40]"
            >
              <Plus size={16} /> Add a stay
            </Link>
          </div>
        </div>

        <BookingPanel
          direction="guest"
          title="Your trips"
          emptyTitle="No guest bookings"
          emptyDetail="Stays you request as a guest will appear here."
          sharedData={{
            bookings: hostBookings.filter((booking) => booking.direction === "guest"),
            loading: hostBookingsLoading,
            error: hostBookingsError,
            refreshing: hostBookingsRefreshing,
            refresh: loadHostBookings,
          }}
        />
        <BookingPanel
          direction="host"
          title="Guest booking requests"
          emptyTitle="No booking requests"
          emptyDetail="Guest requests for your approved nightly stays will appear here."
          sharedData={{
            bookings: hostBookings.filter((booking) => booking.direction === "host"),
            loading: hostBookingsLoading,
            refreshing: hostBookingsRefreshing,
            refresh: loadHostBookings,
          }}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total listings" value={loading ? "—" : listings.length} />
          <SummaryCard label="Awaiting review" value={loading ? "—" : pendingCount} />
          <SummaryCard
            label="Published"
            value={loading ? "—" : listings.filter((listing) => listing.verificationStatus === "approved" && listing.status === "active").length}
          />
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">
            {error}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-semibold">Your stays</h2>
          {loading ? (
            <div className="mt-5 h-36 animate-pulse rounded-3xl bg-[#f0eee8]" />
          ) : listings.length === 0 ? (
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
                          <Clock3 size={13} /> {property.verificationStatus === "rejected"
                            ? "Changes requested"
                            : property.verificationStatus || "Needs review"}
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
                      <p className="mt-3 rounded-xl bg-[#fff1ed] px-3 py-2 text-xs leading-5 text-[#8d392c]">
                        <strong>Changes requested:</strong> {property.verificationNotes}
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
                        ? property.verificationStatus === "rejected" ? "Changes requested" : "Pending review"
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
