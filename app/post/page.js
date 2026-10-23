"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { parseMapCoordinates } from "@/lib/mapLocation";
import { useTheme } from "@/context/ThemeContext";

const PROPERTY_TYPES = [
  "Hotel",
  "Resort",
  "Villa",
  "Homestay",
  "Apartment",
  "Boutique Hotel",
  "Farmhouse",
  "Holiday Home",
  "Serviced Apartment",
];
const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Swimming pool",
  "Free parking",
  "Breakfast included",
  "Beach access",
  "Kitchen",
  "Washer",
  "Workspace",
  "Pet friendly",
  "Lift",
  "Power backup",
  "Security",
];

import { Suspense } from "react";

function PostPropertyForm() {
  const { user, profile, profileError, loading: authLoading, getAccessToken, setRole, refreshProfile } = useAuth();
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const editId = useSearchParams().get("edit");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Rental",
    propertyType: "Homestay",
    stayTier: "Easy",
    priceBasis: "night",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    capacity: "2",
    amenities: [],
    petFriendly: false,
    address: "",
    city: "",
    pincode: "",
    lat: "",
    lng: "",
    shareExactLocation: false,
    isFeatured: false,
  });
  const [mapLink, setMapLink] = useState("");
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hostReady, setHostReady] = useState(false);
  const roleSetupUser = useRef("");

  useEffect(() => {
    const previews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [files]);

  useEffect(() => {
    if (authLoading || !user || !profile) return;
    if (profile.role === "host" || profile.role === "admin") {
      setHostReady(true);
      return;
    }
    if (roleSetupUser.current === user.id) return;
    roleSetupUser.current = user.id;
    setRole("host")
      .then(() => {
        try {
          window.localStorage.setItem("mehmaan-easy:view-mode", "host");
        } catch (storageError) {
          console.error("Unable to save the host workspace preference:", storageError);
        }
        toggleTheme();
        setHostReady(true);
      })
      .catch((roleError) => {
        setError(roleError.message || "Unable to set up host access.");
      });
  }, [authLoading, profile, setRole, toggleTheme, user]);

  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/properties/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Unable to load this listing for editing.");
        }
        const data = await res.json();
        const d = data.property;
        setForm((f) => ({
          ...f,
          ...d,
          propertyType: d.propertyType || "Apartment",
          stayTier: d.stayTier || "Easy",
          priceBasis: d.priceBasis || (d.category === "Rental" ? "month" : "listing"),
          price: String(d.price),
          area: String(d.area || ""),
          capacity: String(d.capacity || 2),
          petFriendly: Boolean(d.petFriendly),
          lat: String(d.location?.coordinates?.[1] ?? d.lat ?? ""),
          lng: String(d.location?.coordinates?.[0] ?? d.lng ?? ""),
          shareExactLocation: Boolean(d.shareExactLocation),
        }));
        setExistingImages(d.images || []);
      } catch (e) {
        setError(e.message || "Error loading listing for edit.");
      }
    })();
  }, [editId, getAccessToken, user]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Location detection is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("lat", String(pos.coords.latitude));
        update("lng", String(pos.coords.longitude));
        setError("");
      },
      () => setError("Location access was unavailable. You can continue without it."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function applyMapLink() {
    const coordinates = parseMapCoordinates(mapLink);
    if (!coordinates) {
      setError("We couldn’t find coordinates in that link. Use a full Google Maps URL with a pin, or paste latitude, longitude.");
      return;
    }
    update("lat", String(coordinates.lat));
    update("lng", String(coordinates.lng));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!user || !profile || !hostReady) {
      setError("Sign in to your host account before posting a property.");
      return;
    }
    if (existingImages.length + files.length < 3) {
      setError("Add at least three property photos before submitting for review.");
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 10 * 1024 * 1024) {
          throw new Error("Use JPG, PNG, WebP, or AVIF photos up to 10 MB each.");
        }
        const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${crypto.randomUUID()}-${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
      }
      const images = [...existingImages, ...uploaded];

      const payload = {
        ...form,
        category: "Rental",
        priceBasis: form.priceBasis,
        price: Number(form.price),
        area: Number(form.area) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        capacity: Number(form.capacity) || 1,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        images,
      };

      const token = await getAccessToken();
      const url = editId ? `/api/properties/${editId}` : "/api/properties";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save listing.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to save listing.");
    } finally {
      setSubmitting(false);
    }
  }


  if (authLoading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <p className="mx-auto max-w-lg px-5 py-40 text-center text-sm text-cream/65">
          Checking your account…
        </p>
      </main>
    );
  }

  if (!user) {
    const next = `/post${editId ? `?edit=${encodeURIComponent(editId)}` : ""}`;
    return (
      <main className="min-h-screen">
        <Navbar />
        <section className="mx-auto max-w-lg px-5 py-40 text-center">
          <p className="mb-2 text-[11px] font-600 uppercase tracking-[0.3em] text-gold">Become a host</p>
          <h1 className="font-display text-3xl font-800 text-cream">Sign in before you start</h1>
          <p className="mt-3 text-sm leading-6 text-cream/60">
            Sign in or create an account first. We’ll bring you straight back here to list your stay.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="rounded-full bg-gold px-6 py-3 text-sm font-700 text-ink hover:bg-gold-soft"
            >
              Log in
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="rounded-full border border-ink-line px-6 py-3 text-sm font-600 text-cream hover:border-gold"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!profile || !hostReady) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <section className="mx-auto max-w-lg px-5 py-40 text-center text-sm text-cream/65">
          <p>{error || profileError || "Setting up your host account…"}</p>
          {profileError && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await refreshProfile();
                } catch (refreshError) {
                  setError(refreshError.message || "Unable to load your account profile.");
                }
              }}
              className="mt-4 rounded-full border border-ink-line px-4 py-2 text-cream hover:border-gold"
            >
              Retry
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-2xl mx-auto px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-600 mb-2">
            {editId ? "Edit listing" : "New listing"}
          </p>
          <h1 className="font-display font-800 text-3xl text-cream mb-2">
            {editId ? "Update your stay" : "List your stay"}
          </h1>
          <p className="mb-8 text-sm leading-6 text-cream/55">
            Every new listing and substantial edit is reviewed before it appears
            to guests. Please provide accurate details and at least three photos.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Description">
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="input resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type of stay">
                <select value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)} className="input">
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <div className="rounded-xl border border-ink-line bg-ink-panel/60 p-3">
                <p className="text-xs font-semibold text-cream/75">Stay collection</p>
                <p className="mt-1 text-xs leading-5 text-cream/45">
                  Mehmaan Easy assigns Easy, Royal, or Gold during the approval review.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <input
                  required
                  min="1"
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Price is per">
                <select value={form.priceBasis} onChange={(e) => update("priceBasis", e.target.value)} className="input">
                  <option value="night">Night</option>
                  <option value="month">Month</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Sleeps up to">
                <input
                  required
                  min="1"
                  type="number"
                  value={form.capacity}
                  onChange={(e) => update("capacity", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Bedrooms">
                <input
                  min="0"
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => update("bedrooms", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Bathrooms">
                <input
                  min="0"
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => update("bathrooms", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Area (sqft, optional)">
                <input
                  type="number"
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Amenities">
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.amenities.includes(a)
                        ? "bg-gold text-ink border-gold"
                        : "border-ink-line text-cream/60 hover:border-gold"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-cream/70">
              <input
                type="checkbox"
                checked={form.petFriendly}
                onChange={(e) => update("petFriendly", e.target.checked)}
              />
              Pets are welcome
            </label>

            <Field label="Address">
              <input
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input required value={form.city} onChange={(e) => update("city", e.target.value)} className="input" />
              </Field>
              <Field label="Pincode">
                <input
                  required
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Tourism license ID (optional · private)">
              <input
                value={form.tourismLicenseId || ""}
                onChange={(event) => update("tourismLicenseId", event.target.value)}
                maxLength={200}
                className="input"
              />
              <span className="mt-1 block text-xs text-cream/45">
                Only Mehmaan Easy admins can view this. You can leave it blank and share it later.
              </span>
            </Field>

            <section className="rounded-2xl border border-ink-line bg-ink-panel/70 p-4">
              <div>
                <h2 className="text-sm font-semibold text-cream">Place your stay on the map</h2>
                <p className="mt-1 text-xs leading-5 text-cream/55">
                  Use your current location, or paste a Google Maps pin link or
                  latitude/longitude.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={mapLink}
                  onChange={(event) => setMapLink(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyMapLink();
                    }
                  }}
                  aria-label="Google Maps link or coordinates"
                  placeholder="Paste a Google Maps link or 15.2993, 74.1240"
                  className="input"
                />
                <button
                  type="button"
                  onClick={applyMapLink}
                  className="shrink-0 rounded-full border border-ink-line px-4 py-2 text-xs font-semibold text-cream/80 transition-colors hover:border-gold hover:text-gold"
                >
                  Use this pin
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={detectLocation}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-cream/85 transition-colors hover:bg-white/15"
                >
                  Use my current location
                </button>
                {form.lat && form.lng && (
                  <span className="text-xs text-cream/55">
                    Pin set · {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
                  </span>
                )}
              </div>
              <label className="mt-4 flex items-start gap-2.5 border-t border-white/10 pt-4 text-xs leading-5 text-cream/70">
                <input
                  type="checkbox"
                  checked={form.shareExactLocation}
                  disabled={!form.lat || !form.lng}
                  onChange={(event) => update("shareExactLocation", event.target.checked)}
                  className="mt-1 accent-gold"
                />
                <span>
                  <span className="font-semibold text-cream">Show the exact pin on the public map</span>
                  <span className="mt-0.5 block text-cream/50">
                    This shares your precise map location with everyone. Leave this
                    off to keep the address private and show guests the city area instead.
                  </span>
                </span>
              </label>
            </section>

            <div className="flex flex-col gap-1.5 text-xs text-cream/60">
              <label htmlFor="property-images">Property photos</label>
              <input
                id="property-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  event.target.value = "";
                  const invalid = selected.find(
                    (file) =>
                      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
                      file.size > 10 * 1024 * 1024
                  );
                  const available = Math.max(0, 30 - existingImages.length - files.length);
                  const additions = selected
                    .filter(
                      (file) =>
                        ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) &&
                        file.size <= 10 * 1024 * 1024
                    )
                    .slice(0, available);
                  setFiles((current) => [...current, ...additions]);
                  if (invalid) {
                    setError("Photos must be JPG, PNG, WebP, or AVIF files up to 10 MB each.");
                  } else if (selected.length > available) {
                    setError("A listing can have up to 30 photos.");
                  } else if (additions.length) {
                    setError("");
                  }
                }}
                className="text-sm text-cream/70"
              />
              <span className="text-xs text-cream/45">
                {existingImages.length + files.length} selected. Add photos in multiple rounds; at least three are required.
              </span>
              {existingImages.length + files.length < 3 && (
                <span className="text-xs text-gold-soft">Select at least 3 photos to continue.</span>
              )}
              {(existingImages.length > 0 || files.length > 0) && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {existingImages.map((img, i) => (
                    <div key={`${img}-${i}`} className="relative overflow-hidden rounded-lg">
                      <img src={img} className="h-24 w-full object-cover" alt={`Property photo ${i + 1}`} />
                      <button
                        type="button"
                        onClick={() => setExistingImages((images) => images.filter((_, index) => index !== i))}
                        className="absolute right-1 top-1 rounded-full bg-black/75 px-2 py-1 text-[10px] text-white"
                        aria-label={`Remove property photo ${i + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {files.map((file, i) => (
                    <div key={`${file.name}-${file.lastModified}-${i}`} className="relative overflow-hidden rounded-lg bg-ink-panel">
                      <img src={filePreviews[i]} className="h-24 w-full object-cover" alt={file.name} />
                      <button
                        type="button"
                        onClick={() => setFiles((selected) => selected.filter((_, index) => index !== i))}
                        className="absolute right-1 top-1 rounded-full bg-black/75 px-2 py-1 text-[10px] text-white"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              disabled={submitting}
              className="mt-2 px-5 py-3 rounded-full bg-gold text-ink font-700 text-sm disabled:opacity-50 hover:bg-gold-soft transition-colors"
            >
              {submitting ? "Saving…" : editId ? "Submit changes for review" : "Submit for review"}
            </button>
          </form>
        </motion.div>
      </section>

      <style jsx global>{`
        .input {
          background: #1b3e44;
          border: 1px solid #2a4f55;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: #f6f1e4;
          outline: none;
          width: 100%;
        }
        .input:focus {
          border-color: #c79a4b;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-xs text-cream/60 flex flex-col gap-1.5">
      {label}
      {children}
    </label>
  );
}

export default function PostPropertyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <Navbar />
        <p className="text-center text-cream/50 py-24">Loading editor…</p>
      </main>
    }>
      <PostPropertyForm />
    </Suspense>
  );
}
