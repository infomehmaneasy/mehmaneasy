"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/firebase";

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
const STAY_TIERS = ["Royal", "Gold", "Easy"];
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
  const { user, profile } = useAuth();
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
    isFeatured: false,
  });
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
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
          lat: String(d.location?.coordinates?.[1] || d.lat || ""),
          lng: String(d.location?.coordinates?.[0] || d.lng || ""),
        }));
        setExistingImages(d.images || []);
      } catch (e) {
        setError(e.message || "Error loading listing for edit.");
      }
    })();
  }, [editId, user]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!user || !profile?.verified) {
      setError("Please verify your account before posting a property.");
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
        const path = `properties/${user.uid}/${Date.now()}-${file.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, file);
        uploaded.push(await getDownloadURL(r));
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

      const token = await user.getIdToken();
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
              <Field label="Collection">
                <select value={form.stayTier} onChange={(e) => update("stayTier", e.target.value)} className="input">
                  {STAY_TIERS.map((tier) => (
                    <option key={tier}>{tier}</option>
                  ))}
                </select>
              </Field>
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={detectLocation}
                className="text-xs px-4 py-2 rounded-full border border-ink-line text-cream/70 hover:border-gold hover:text-gold transition-colors"
              >
                Use my current location
              </button>
              {form.lat && form.lng && (
                <span className="text-xs text-cream/40">
                  Location saved privately; guests see only the city.
                </span>
              )}
            </div>

            <Field label="Images">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="text-sm text-cream/70"
              />
              <span className="text-xs text-cream/45">At least three images are required.</span>
              {existingImages.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {existingImages.map((img, i) => (
                    <img key={i} src={img} className="w-14 h-14 rounded-lg object-cover" alt="" />
                  ))}
                </div>
              )}
            </Field>

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
