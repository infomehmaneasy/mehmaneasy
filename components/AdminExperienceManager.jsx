"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { EXPERIENCE_CATEGORIES } from "@/lib/experienceData";

const EMPTY_FORM = {
  title: "",
  summary: "",
  description: "",
  category: EXPERIENCE_CATEGORIES[0],
  city: "",
  location: "",
  duration_hours: "2",
  price_per_person: "",
  capacity: "10",
  highlights: "",
  inclusions: "",
  requirements: "",
  status: "draft",
  is_featured: false,
};

export default function AdminExperienceManager() {
  const { user, getAccessToken } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    loadExperiences();
  }, []);

  async function loadExperiences() {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/experiences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load experiences.");
      setExperiences(data.experiences || []);
    } catch (loadError) {
      console.error("Unable to load experiences for admin:", loadError);
      setError(loadError.message || "Unable to load experiences.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setImages([]);
    setFiles([]);
    setEditingId("");
  }

  function editExperience(experience) {
    setForm({
      title: experience.title,
      summary: experience.summary,
      description: experience.description,
      category: experience.category,
      city: experience.city,
      location: experience.location,
      duration_hours: String(experience.duration_hours),
      price_per_person: String(experience.price_per_person),
      capacity: String(experience.capacity),
      highlights: (experience.highlights || []).join("\n"),
      inclusions: (experience.inclusions || []).join("\n"),
      requirements: experience.requirements || "",
      status: experience.status,
      is_featured: Boolean(experience.is_featured),
    });
    setImages(experience.images || []);
    setFiles([]);
    setEditingId(experience.id);
    setError("");
    setMessage("");
    document.getElementById("experience-editor")?.scrollIntoView({ behavior: "smooth" });
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!user || !supabase) throw new Error("Sign in to manage experience listings.");
      const uploaded = [];
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 10 * 1024 * 1024) {
          throw new Error("Use JPG, PNG, WebP, or AVIF photos up to 10 MB each.");
        }
        const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/experiences/${crypto.randomUUID()}-${name}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
      }

      const token = await getAccessToken();
      const payload = {
        ...form,
        duration_hours: Number(form.duration_hours),
        price_per_person: Number(form.price_per_person),
        capacity: Number(form.capacity),
        images: [...images, ...uploaded],
        highlights: lines(form.highlights),
        inclusions: lines(form.inclusions),
      };
      const response = await fetch(
        editingId ? `/api/admin/experiences/${editingId}` : "/api/admin/experiences",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save experience.");
      setMessage(editingId ? "Experience updated." : "Experience created.");
      resetForm();
      await loadExperiences();
    } catch (saveError) {
      console.error("Unable to save experience:", saveError);
      setError(saveError.message || "Unable to save experience.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExperience(experience) {
    if (!window.confirm(`Delete “${experience.title}”? This cannot be undone.`)) return;
    setBusyId(experience.id);
    setError("");
    setMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/experiences/${experience.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete experience.");
      setExperiences((current) => current.filter((item) => item.id !== experience.id));
      setMessage("Experience deleted.");
      if (editingId === experience.id) resetForm();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete experience.");
    } finally {
      setBusyId("");
    }
  }

  const photoCount = useMemo(() => images.length + files.length, [images.length, files.length]);

  return (
    <div className="mt-8 grid gap-8">
      <section id="experience-editor" className="rounded-3xl border border-[#e8e7e1] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#bd604a]">Experience listing</p>
            <h2 className="mt-2 text-2xl font-semibold">{editingId ? "Edit experience" : "Create an experience"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65716a]">
              Add photos, a clear itinerary and per-person pricing. Drafts stay private until published.
            </p>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full border border-[#d8d9d2] px-4 py-2 text-sm font-semibold text-[#526058]">
              <X size={15} /> Cancel edit
            </button>
          )}
        </div>

        {error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-2xl bg-[#edf5ef] p-4 text-sm text-[#2b5e3c]">{message}</p>}

        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Experience name">
            <input required maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(event) => update("category", event.target.value)} className="admin-input">
              {EXPERIENCE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Short summary" className="md:col-span-2">
            <textarea required rows={2} maxLength={280} value={form.summary} onChange={(event) => update("summary", event.target.value)} className="admin-input resize-y" />
          </Field>
          <Field label="Full description" className="md:col-span-2">
            <textarea required rows={5} maxLength={10000} value={form.description} onChange={(event) => update("description", event.target.value)} className="admin-input resize-y" />
          </Field>
          <Field label="City">
            <input required value={form.city} onChange={(event) => update("city", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Meeting point / area">
            <input required value={form.location} onChange={(event) => update("location", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Duration (hours)">
            <input required min="0.25" max="72" step="0.25" type="number" value={form.duration_hours} onChange={(event) => update("duration_hours", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Price per person (₹)">
            <input required min="1" type="number" value={form.price_per_person} onChange={(event) => update("price_per_person", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Maximum group size">
            <input required min="1" max="1000" type="number" value={form.capacity} onChange={(event) => update("capacity", event.target.value)} className="admin-input" />
          </Field>
          <Field label="Listing status">
            <select value={form.status} onChange={(event) => update("status", event.target.value)} className="admin-input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Highlights (one per line)">
            <textarea rows={4} value={form.highlights} onChange={(event) => update("highlights", event.target.value)} className="admin-input resize-y" />
          </Field>
          <Field label="What&apos;s included (one per line)">
            <textarea rows={4} value={form.inclusions} onChange={(event) => update("inclusions", event.target.value)} className="admin-input resize-y" />
          </Field>
          <Field label="Requirements / what to bring" className="md:col-span-2">
            <textarea rows={3} maxLength={3000} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} className="admin-input resize-y" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[#526058] md:col-span-2">
            <input type="checkbox" checked={form.is_featured} onChange={(event) => update("is_featured", event.target.checked)} />
            Feature this experience near the top of the catalogue
          </label>
          <Field label={`Photos (${photoCount} selected)`} className="md:col-span-2">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                const selected = Array.from(event.target.files || []);
                event.target.value = "";
                const remaining = Math.max(0, 20 - photoCount);
                setFiles((current) => [...current, ...selected.slice(0, remaining)]);
                if (selected.length > remaining) setError("An experience can have up to 20 photos.");
              }}
              className="block w-full text-sm text-[#526058]"
            />
            <p className="mt-1 text-xs text-[#758078]">Use JPG, PNG, WebP, or AVIF images up to 10 MB each. Published experiences need at least one photo.</p>
            {(images.length > 0 || files.length > 0) && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-xl">
                    <img src={image} alt={`Experience photo ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">Remove</button>
                  </div>
                ))}
                {files.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="relative h-24 overflow-hidden rounded-xl">
                    <img src={previews[index]} alt={file.name} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#20372f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {editingId ? <Pencil size={15} /> : <Plus size={16} />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create experience"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Experience listings</h2>
            <p className="mt-1 text-sm text-[#65716a]">Manage published experiences and drafts.</p>
          </div>
          <span className="text-xs text-[#758078]">{experiences.length} total</span>
        </div>
        {loading ? (
          <div className="mt-4 h-32 animate-pulse rounded-3xl bg-[#f0eee8]" />
        ) : experiences.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-[#d8d5cc] bg-white p-8 text-sm text-[#65716a]">No experiences have been created yet.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {experiences.map((experience) => (
              <article key={experience.id} className="flex flex-col gap-4 rounded-3xl border border-[#e8e7e1] bg-white p-4 sm:flex-row sm:items-center">
                <img src={experience.images?.[0] || "/logo.png"} alt="" className="h-36 w-full rounded-2xl object-cover sm:h-20 sm:w-28" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#29352f]">{experience.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${experience.status === "published" ? "bg-[#edf5ef] text-[#376247]" : "bg-[#f7f5f1] text-[#65716a]"}`}>{experience.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#65716a]">{experience.category} · {experience.location}, {experience.city}</p>
                  <p className="mt-1 text-xs text-[#758078]">₹{Number(experience.price_per_person).toLocaleString("en-IN")} per person</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editExperience(experience)} className="inline-flex items-center gap-2 rounded-full border border-[#d8d9d2] px-4 py-2 text-sm font-semibold text-[#34433b]"><Pencil size={14} /> Edit</button>
                  <button type="button" disabled={busyId === experience.id} onClick={() => deleteExperience(experience)} aria-label={`Delete ${experience.title}`} className="inline-flex items-center gap-2 rounded-full border border-[#e5c6bb] px-4 py-2 text-sm font-semibold text-[#8d392c] disabled:opacity-50"><Trash2 size={14} /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <style jsx global>{`
        .admin-input {
          width: 100%;
          border: 1px solid #dedfd8;
          border-radius: 12px;
          background: #fffdf9;
          padding: 11px 13px;
          color: #29352f;
          font-size: 14px;
          outline: none;
        }
        .admin-input:focus { border-color: #bd604a; }
      `}</style>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block text-xs font-semibold text-[#526058] ${className}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function lines(value) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}
