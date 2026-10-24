"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock3, ShieldAlert, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingPanel from "@/components/BookingPanel";
import AdminExperienceManager from "@/components/AdminExperienceManager";
import AdminSiteMediaManager from "@/components/AdminSiteMediaManager";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [notes, setNotes] = useState({});
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceLoaded, setMarketplaceLoaded] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadQueues = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [propertyResponse, enquiryResponse] = await Promise.all([
        fetch("/api/admin/properties", { headers }),
        fetch("/api/admin/enquiries", { headers }),
      ]);
      const [propertyData, enquiryData] = await Promise.all([
        propertyResponse.json(),
        enquiryResponse.json(),
      ]);
      if (!propertyResponse.ok) {
        throw new Error(propertyData.error || "Unable to load property reviews.");
      }
      if (!enquiryResponse.ok) {
        throw new Error(enquiryData.error || "Unable to load guest questions.");
      }
      setProperties(propertyData.properties || []);
      setEnquiries(enquiryData.enquiries || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load admin queues.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, user]);

  async function loadMarketplaceListings() {
    if (!user) return;
    setMarketplaceLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/properties?scope=marketplace", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load marketplace listings.");
      setMarketplaceListings(data.properties || []);
      setMarketplaceLoaded(true);
    } catch (loadError) {
      setError(loadError.message || "Unable to load marketplace listings.");
    } finally {
      setMarketplaceLoading(false);
    }
  }

  function selectTab(tab) {
    setActiveTab(tab);
    if (tab === "manage" && !marketplaceLoaded && !marketplaceLoading) {
      loadMarketplaceListings();
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (user) loadQueues();
    else setLoading(false);
  }, [authLoading, user, loadQueues]);

  async function reviewProperty(property, action) {
    const reviewNotes = (notes[property._id] || "").trim();
    if (action === "reject" && !reviewNotes) {
      setError("Add actionable improvement notes before rejecting a stay.");
      return;
    }
    setBusyId(property._id);
    setError("");
    setMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/properties/${property._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes,
          stayTier: tiers[property._id] || property.stayTier || "Easy",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review stay.");
      setProperties((items) => items.filter((item) => item._id !== property._id));
      setMessage(
        action === "approve"
          ? "Stay approved and published."
          : "Stay rejected; improvement notes were saved."
      );
    } catch (reviewError) {
      setError(reviewError.message || "Unable to review stay.");
    } finally {
      setBusyId("");
    }
  }

  async function markEnquiryReviewed(enquiry) {
    setBusyId(enquiry._id);
    setError("");
    setMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enquiryId: enquiry._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update enquiry.");
      setEnquiries((items) => items.filter((item) => item._id !== enquiry._id));
      setMessage("Guest question marked as reviewed.");
    } catch (reviewError) {
      setError(reviewError.message || "Unable to update enquiry.");
    } finally {
      setBusyId("");
    }
  }

  async function removeMarketplaceListing(property) {
    if (!window.confirm(`Remove “${property.title}” from public search? Existing booking records will be preserved.`)) {
      return;
    }
    setBusyId(property._id);
    setError("");
    setMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/properties/${property._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove this listing.");
      setMarketplaceListings((items) => items.filter((item) => item._id !== property._id));
      setMessage("Listing removed from public search. Existing bookings were preserved.");
    } catch (removeError) {
      setError(removeError.message || "Unable to remove this listing.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24302b]">
      <Navbar />
      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-32 sm:px-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd604a]">
          Mehmaan Easy operations
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Admin workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65716a]">
          Review host submissions before publishing and respond to guest
          questions through the support queue.
        </p>

        <div className="mt-8 flex gap-2 overflow-x-auto border-b border-[#e8e7e1]">
          {[
            ["properties", `Property reviews (${properties.length})`],
            ["manage", `Marketplace listings (${marketplaceListings.length})`],
            ["enquiries", `Guest questions (${enquiries.length})`],
            ["bookings", "Bookings"],
            ["experiences", "Experiences"],
            ["site-media", "Home page images"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectTab(tab)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
                activeTab === tab
                  ? "border-[#bd604a] text-[#bd604a]"
                  : "border-transparent text-[#65716a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!authLoading && !user && (
          <div className="mt-8 rounded-2xl border border-[#e5c6bb] bg-white p-5 text-sm text-[#34433b]">
            Sign in with your configured admin account to continue.
          </div>
        )}
        {error && (
          <div role="alert" className="mt-8 rounded-2xl bg-[#fff1ed] p-4 text-sm text-[#8d392c]">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="mt-8 rounded-2xl bg-[#edf5ef] p-4 text-sm text-[#2b5e3c]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid gap-5">
            {[0, 1].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-[#f0eee8]" />
            ))}
          </div>
        ) : activeTab === "manage" && marketplaceLoading ? (
          <div className="mt-10 grid gap-5">
            {[0, 1].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-3xl bg-[#f0eee8]" />
            ))}
          </div>
        ) : user && !error && activeTab === "properties" && properties.length === 0 ? (
          <EmptyState title="Review queue is clear" detail="No pending property reviews." />
        ) : user && !error && activeTab === "manage" && marketplaceListings.length === 0 ? (
          <EmptyState title="No live marketplace listings" detail="Approved stays available to guests will appear here." />
        ) : user && !error && activeTab === "enquiries" && enquiries.length === 0 ? (
          <EmptyState title="No guest questions" detail="New pre-booking questions appear here." />
        ) : activeTab === "experiences" ? (
          <AdminExperienceManager />
        ) : activeTab === "site-media" ? (
          <AdminSiteMediaManager />
        ) : activeTab === "bookings" ? (
          <BookingPanel
            direction="admin"
            title="Booking oversight · read only"
            emptyTitle="No booking requests"
            emptyDetail="All guest requests and host decisions are visible here. Hosts handle booking decisions."
          />
        ) : activeTab === "properties" ? (
          <div className="mt-10 grid gap-5">
            {properties.map((property) => (
              <article key={property._id} className="overflow-hidden rounded-3xl border border-[#e8e7e1] bg-white">
                <div>
                  <div className="grid grid-cols-2 gap-1 bg-[#f0eee8] sm:grid-cols-3 lg:grid-cols-4">
                    {(property.images || []).map((image, index) => (
                      <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" aria-label={`Open full-size photo ${index + 1}`}>
                        <img src={image} alt={`${property.title} photo ${index + 1}`} className="h-36 w-full object-cover sm:h-40" />
                      </a>
                    ))}
                    {!property.images?.length && (
                      <div className="col-span-full flex h-36 items-center justify-center text-sm text-[#758078]">
                        No photos attached
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8eee8] px-3 py-1.5 text-xs font-semibold text-[#9b503e]">
                        <Clock3 size={14} />
                        {property.verificationStatus || "Legacy listing · needs review"}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-[#29352f]">{property.title}</h2>
                    <p className="mt-1 text-sm text-[#65716a]">
                      {property.propertyType || "Stay"} · {property.city}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#34433b]">
                      ₹{Number(property.price).toLocaleString("en-IN")} / {property.priceBasis || "night"}
                    </p>
                    <section className="mt-5">
                      <h3 className="text-sm font-semibold text-[#34433b]">About this stay</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#65716a]">{property.description}</p>
                    </section>
                    <section className="mt-5">
                      <h3 className="text-sm font-semibold text-[#34433b]">Listing details</h3>
                      <dl className="mt-2 grid gap-x-5 gap-y-2 rounded-2xl bg-[#f7f5f1] p-4 text-xs text-[#526058] sm:grid-cols-2">
                        <Detail label="Guests" value={property.capacity || 2} />
                        <Detail label="Bedrooms" value={property.bedrooms ?? 0} />
                        <Detail label="Bathrooms" value={property.bathrooms ?? 0} />
                        <Detail label="Area" value={property.area ? `${property.area} sq ft` : "Not provided"} />
                        <Detail label="Full address" value={[property.address, property.city, property.pincode].filter(Boolean).join(", ")} />
                        <Detail label="Host email" value={property.ownerEmail} />
                        <Detail label="Tourism license ID" value={property.tourismLicenseId || "Not provided"} />
                        <Detail label="Cleaning fee" value={`₹${Number(property.cleaningFee || 0).toLocaleString("en-IN")}`} />
                        <Detail label="Exact map pin" value={property.location?.coordinates?.join(", ") || "Not provided"} />
                        <Detail label="Public exact pin" value={property.shareExactLocation ? "Yes" : "No"} />
                      </dl>
                    </section>
                    {property.amenities?.length > 0 && (
                      <section className="mt-5">
                        <h3 className="text-sm font-semibold text-[#34433b]">Amenities and features</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {property.amenities.map((amenity) => (
                            <span key={amenity} className="rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs text-[#376247]">{amenity}</span>
                          ))}
                          {property.petFriendly && <span className="rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs text-[#376247]">Pet friendly</span>}
                        </div>
                      </section>
                    )}
                    <label className="mt-5 block text-xs font-semibold text-[#526058]">
                      Assign collection before approval
                      <select
                        value={tiers[property._id] || property.stayTier || "Easy"}
                        onChange={(event) => setTiers((current) => ({ ...current, [property._id]: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[#e0e1dc] bg-white p-3 text-sm font-normal text-[#29352f] outline-none focus:border-[#bd604a]"
                      >
                        {["Classic", "Easy", "Royal"].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                      </select>
                    </label>
                    <label className="mt-5 block text-xs font-semibold text-[#526058]">
                      Review / improvement notes
                      <textarea
                        value={notes[property._id] || ""}
                        onChange={(event) =>
                          setNotes((values) => ({ ...values, [property._id]: event.target.value }))
                        }
                        maxLength={2000}
                        rows={2}
                        className="mt-2 w-full resize-y rounded-xl border border-[#e0e1dc] p-3 text-sm font-normal outline-none focus:border-[#bd604a]"
                        placeholder="Add actionable feedback if this stay needs improvements."
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busyId === property._id}
                        onClick={() => reviewProperty(property, "approve")}
                        className="rounded-full bg-[#20372f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d4a40] disabled:opacity-50"
                      >
                        Approve & publish as {tiers[property._id] || property.stayTier || "Easy"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === property._id}
                        onClick={() => reviewProperty(property, "reject")}
                        className="inline-flex items-center gap-2 rounded-full border border-[#e5c6bb] px-5 py-2.5 text-sm font-semibold text-[#8d392c] transition hover:bg-[#fff1ed] disabled:opacity-50"
                      >
                        <ShieldAlert size={15} />
                        Reject with notes
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : activeTab === "manage" ? (
          <div className="mt-10 grid gap-4">
            {marketplaceListings.map((property) => (
              <article key={property._id} className="flex flex-col gap-4 rounded-3xl border border-[#e8e7e1] bg-white p-4 sm:flex-row sm:items-center sm:p-5">
                <img
                  src={property.images?.[0] || "/logo.png"}
                  alt=""
                  className="h-44 w-full rounded-2xl object-cover sm:h-24 sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-[#29352f]">{property.title}</h2>
                  <p className="mt-1 text-sm text-[#65716a]">
                    {property.propertyType || property.category} · {property.city}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#34433b]">
                    ₹{Number(property.price).toLocaleString("en-IN")} / {property.priceBasis || "night"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === property._id}
                  onClick={() => removeMarketplaceListing(property)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5c6bb] px-4 py-2.5 text-sm font-semibold text-[#8d392c] transition hover:bg-[#fff1ed] disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  {busyId === property._id ? "Removing…" : "Remove from marketplace"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {enquiries.map((enquiry) => (
              <article key={enquiry._id} className="rounded-3xl border border-[#e8e7e1] bg-white p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bd604a]">
                      {enquiry.propertyTitle || "Stay enquiry"}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-[#29352f]">{enquiry.buyerName}</h2>
                    <p className="mt-1 text-sm text-[#65716a]">
                      <a className="underline" href={`mailto:${enquiry.buyerEmail}`}>{enquiry.buyerEmail}</a>
                      {" · "}
                      <a className="underline" href={`tel:${enquiry.buyerPhone}`}>{enquiry.buyerPhone}</a>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === enquiry._id}
                    onClick={() => markEnquiryReviewed(enquiry)}
                    className="rounded-full border border-[#d8d9d2] px-4 py-2 text-sm font-semibold text-[#34433b] hover:bg-[#f7f5f1] disabled:opacity-50"
                  >
                    Mark reviewed
                  </button>
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#f7f5f1] p-4 text-sm leading-6 text-[#526058]">
                  {enquiry.message || "The guest would like more information about this stay."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="mt-10 rounded-3xl border border-[#e8e7e1] bg-white px-6 py-16 text-center">
      <BadgeCheck className="mx-auto text-[#5b8a68]" size={30} />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#758078]">{detail}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="font-semibold text-[#34433b]">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "Not provided"}</dd>
    </div>
  );
}
