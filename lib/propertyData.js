const STAY_TYPES = new Set([
  "Hotel",
  "Resort",
  "Villa",
  "Homestay",
  "Apartment",
  "Boutique Hotel",
  "Farmhouse",
  "Holiday Home",
  "Serviced Apartment",
]);

const STAY_TIERS = new Set(["Royal", "Gold", "Easy"]);

export function toPublicProperty(property) {
  const data = typeof property.toObject === "function" ? property.toObject() : { ...property };
  const {
    ownerUid,
    ownerEmail,
    address,
    location,
    lat,
    lng,
    pincode,
    verificationNotes,
    ...publicData
  } = data;

  return {
    ...publicData,
    id: String(data._id || data.id),
    propertyType: STAY_TYPES.has(data.propertyType)
      ? data.propertyType
      : data.category === "Rental"
        ? "Homestay"
        : "Apartment",
    stayTier: STAY_TIERS.has(data.stayTier)
      ? data.stayTier
      : STAY_TIERS.has(data.category)
        ? data.category
        : null,
    priceBasis:
      data.priceBasis ||
      (data.category === "Rental" ? "month" : "listing"),
    city: data.city,
  };
}

export function toPropertyUpdate(payload) {
  const editableFields = [
    "title",
    "description",
    "category",
    "propertyType",
    "stayTier",
    "price",
    "priceBasis",
    "area",
    "bedrooms",
    "bathrooms",
    "capacity",
    "amenities",
    "petFriendly",
    "instantBook",
    "cleaningFee",
    "images",
    "address",
    "city",
    "pincode",
  ];
  const update = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(payload, field))
      .map((field) => [field, payload[field]])
  );

  if (Object.hasOwn(payload, "status")) {
    if (!["active", "sold", "inactive"].includes(payload.status)) {
      throw new Error("Invalid listing status.");
    }
    update.status = payload.status;
  }

  if (Object.hasOwn(payload, "lat") || Object.hasOwn(payload, "lng")) {
    const hasLatitude = payload.lat !== null && payload.lat !== "";
    const hasLongitude = payload.lng !== null && payload.lng !== "";
    if (hasLatitude !== hasLongitude) {
      throw new Error("Both latitude and longitude are required.");
    }
    if (!hasLatitude) return update;

    const lat = Number(payload.lat);
    const lng = Number(payload.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Valid latitude and longitude are required.");
    }
    update.location = { type: "Point", coordinates: [lng, lat] };
  }

  return update;
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
