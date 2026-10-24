"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { DEFAULT_SITE_MEDIA } from "@/lib/siteMedia";

const GROUP_LABELS = [
  ["collections", "Stay collection covers"],
  ["destinations", "Destination covers"],
];

export default function AdminSiteMediaManager() {
  const { getAccessToken } = useAuth();
  const [media, setMedia] = useState(DEFAULT_SITE_MEDIA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newCity, setNewCity] = useState("");
  const [uploadingCity, setUploadingCity] = useState("");

  useEffect(() => {
    let active = true;
    async function loadMedia() {
      setLoading(true);
      setError("");
      try {
        const token = await getAccessToken();
        const response = await fetch("/api/admin/site-media", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          const migrationHint = data.migrationRequired
            ? " Apply supabase/migrations/202610240003_public_map_and_discovery_media.sql in Supabase SQL Editor."
            : "";
          throw new Error(`${data.error || "Unable to load discovery images."}${migrationHint}`);
        }
        if (active) setMedia(data.media);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load discovery images.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMedia();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  function updateImage(group, name, value) {
    setMedia((current) => ({
      ...current,
      [group]: { ...current[group], [name]: value },
    }));
  }

  function renameDestination(previousName, nextName) {
    const name = nextName.trim().replace(/\s+/g, " ");
    if (!name) {
      setError("Destination names cannot be blank.");
      return false;
    }
    if (name.length > 80) {
      setError("Destination names must be 80 characters or fewer.");
      return false;
    }
    if (
      Object.keys(media.destinations).some(
        (existingName) =>
          existingName !== previousName &&
          existingName.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("That destination name is already in the list.");
      return false;
    }
    if (name !== previousName) {
      const destinations = { ...media.destinations };
      const imageUrl = destinations[previousName];
      delete destinations[previousName];
      destinations[name] = imageUrl;
      setMedia((current) => ({ ...current, destinations }));
      setMessage(`${previousName} renamed to ${name}. Save image changes to publish it.`);
    }
    setError("");
    return true;
  }

  function deleteDestination(name) {
    if (!window.confirm(`Delete ${name} from the home page destinations?`)) return;
    const destinations = { ...media.destinations };
    delete destinations[name];
    setMedia((current) => ({ ...current, destinations }));
    setMessage(`${name} removed. Save image changes to publish the update.`);
    setError("");
  }

  async function addCity(event) {
    event.preventDefault();
    const city = newCity.trim().replace(/\s+/g, " ");
    if (!city) return;
    if (city.length > 80) {
      setError("City names must be 80 characters or fewer.");
      return;
    }
    if (Object.keys(media.destinations).some((name) => name.toLowerCase() === city.toLowerCase())) {
      setError("That city is already in the destination list.");
      return;
    }

    setError("");
    setMessage("");
    const updatedMedia = {
      ...media,
      destinations: { ...media.destinations, [city]: "" },
    };
    setMedia(updatedMedia);
    setNewCity("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/site-media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ media: updatedMedia }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add this city.");
      setMedia(data.media);
      setMessage(`${city} added. Upload its cover image and save your changes.`);
    } catch (addError) {
      setMedia(media);
      setError(addError.message || "Unable to add this city.");
    }
  }

  async function uploadImage(group, name, file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, WebP, or AVIF image no larger than 10 MB.");
      return;
    }
    if (!supabase) {
      setError("Image uploads are unavailable because Supabase is not configured.");
      return;
    }

    setUploadingCity(`${group}:${name}`);
    setError("");
    setMessage("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Sign in with the admin account before uploading images.");
      const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("site-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      updateImage(group, name, data.publicUrl);
      setMessage(`${name} image uploaded. Save image changes to publish it.`);
    } catch (uploadError) {
      setError(uploadError.message || `Unable to upload the ${name} image.`);
    } finally {
      setUploadingCity("");
    }
  }

  async function saveMedia() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/site-media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ media }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save discovery images.");
      setMedia(data.media);
      setMessage("Discovery images saved. The home page now uses the updated covers.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save discovery images.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Home page imagery</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65716a]">
          Change the cover photos shown on the Classic, Easy and Royal cards and
          on each destination card.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-[#65716a]">Loading image settings…</p>
      ) : (
        <>
          {GROUP_LABELS.map(([group, label]) => (
            <section key={group}>
              <h3 className="mb-4 text-lg font-semibold">{label}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(media[group]).map(([name, imageUrl]) => (
                  <DestinationMediaCard
                    key={name}
                    name={name}
                    imageUrl={imageUrl}
                    isDestination={group === "destinations"}
                    uploading={uploadingCity === `${group}:${name}`}
                    uploadDisabled={Boolean(uploadingCity)}
                    onUpload={(file) => uploadImage(group, name, file)}
                    onImageUrlChange={(value) => updateImage(group, name, value)}
                    onRename={renameDestination}
                    onDelete={deleteDestination}
                  />
                ))}
              </div>
              {group === "destinations" && (
                <form onSubmit={addCity} className="mt-5 flex max-w-xl gap-2">
                  <input
                    value={newCity}
                    onChange={(event) => setNewCity(event.target.value)}
                    maxLength={80}
                    placeholder="Add a city or destination"
                    aria-label="New city or destination"
                    className="min-w-0 flex-1 rounded-xl border border-[#d8d9d2] bg-white px-4 py-3 text-sm text-[#27332d] outline-none focus:border-[#173b36]"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-[#173b36] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Add city
                  </button>
                </form>
              )}
            </section>
          ))}
        </>
      )}
      {error && <p role="alert" className="rounded-xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-[#edf5ef] p-4 text-sm text-[#376247]">{message}</p>}
      <button
        type="button"
        onClick={saveMedia}
        disabled={loading || saving}
        className="rounded-full bg-[#173b36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#25564e] disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? "Saving images…" : "Save image changes"}
      </button>
    </div>
  );
}

function DestinationMediaCard({
  name,
  imageUrl,
  isDestination,
  uploading,
  uploadDisabled,
  onUpload,
  onImageUrlChange,
  onRename,
  onDelete,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  function saveName(event) {
    event.preventDefault();
    if (onRename(name, nameDraft)) setEditingName(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e7e1] bg-white">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} cover preview`}
          className="h-36 w-full bg-[#f0eee8] object-cover"
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-[#f0eee8] text-xs text-[#65716a]">
          Upload a cover image
        </div>
      )}
      <div className="px-4 pt-3">
        {editingName ? (
          <form onSubmit={saveName} className="flex gap-2">
            <input
              autoFocus
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={80}
              aria-label={`New name for ${name}`}
              className="min-w-0 flex-1 rounded-lg border border-[#d8d9d2] px-2 py-1.5 text-xs text-[#27332d] outline-none focus:border-[#173b36]"
            />
            <button type="submit" aria-label={`Save ${name} name`} className="rounded-lg bg-[#edf5ef] p-2 text-[#315e41]">
              <Check size={15} />
            </button>
            <button
              type="button"
              aria-label={`Cancel renaming ${name}`}
              onClick={() => {
                setNameDraft(name);
                setEditingName(false);
              }}
              className="rounded-lg bg-[#f7f5f1] p-2 text-[#526058]"
            >
              <X size={15} />
            </button>
          </form>
        ) : (
          <div className="flex min-h-6 items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-[#34433b]">{name}</p>
            {isDestination && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`Rename ${name}`}
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(true);
                  }}
                  className="rounded-lg p-2 text-[#526058] transition hover:bg-[#f4f2ed] hover:text-[#173b36]"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${name}`}
                  onClick={() => onDelete(name)}
                  className="rounded-lg p-2 text-[#8d392c] transition hover:bg-[#fff1ed]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <label className="mx-4 mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#c9cec8] px-3 text-center text-xs font-semibold text-[#34433b] transition hover:border-[#173b36] hover:bg-[#f8f7f3]">
        {uploading ? "Uploading…" : "Choose image from device"}
        <input
          type="file"
          accept="image/*"
          disabled={uploadDisabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            onUpload(file);
          }}
          aria-label={`Upload ${name} cover image`}
          className="sr-only"
        />
      </label>
      <input
        type="url"
        maxLength={2048}
        value={imageUrl}
        onChange={(event) => onImageUrlChange(event.target.value)}
        aria-label={`${name} cover image URL`}
        placeholder="Or paste an HTTPS image URL"
        className="mt-2 w-full bg-transparent px-4 py-3 text-xs text-[#526058] outline-none"
      />
    </div>
  );
}
