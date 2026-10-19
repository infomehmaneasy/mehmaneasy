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
const EDITABLE_FIELDS = [
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

export function toPublicProperty(property) {
  const {
    ownerUid,
    ownerEmail,
    address,
    latitude,
    longitude,
    pincode,
    verificationNotes,
    ...publicData
  } = property;
  return {
    ...publicData,
    id: String(property.id),
    propertyType: STAY_TYPES.has(property.propertyType)
      ? property.propertyType
      : property.category === "Rental"
        ? "Homestay"
        : "Apartment",
    stayTier: STAY_TIERS.has(property.stayTier)
      ? property.stayTier
      : STAY_TIERS.has(property.category)
        ? property.category
        : null,
    priceBasis: property.priceBasis || (property.category === "Rental" ? "month" : "listing"),
  };
}

export function toPropertyUpdate(payload) {
  const update = Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => Object.hasOwn(payload, field)).map((field) => [
      field,
      payload[field],
    ])
  );

  if (Object.hasOwn(payload, "lat") || Object.hasOwn(payload, "lng")) {
    const hasLatitude = payload.lat !== null && payload.lat !== "";
    const hasLongitude = payload.lng !== null && payload.lng !== "";
    if (hasLatitude !== hasLongitude) {
      throw new Error("Both latitude and longitude are required.");
    }
    if (hasLatitude) {
      const latitude = Number(payload.lat);
      const longitude = Number(payload.lng);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        throw new Error("Valid latitude and longitude are required.");
      }
      update.latitude = latitude;
      update.longitude = longitude;
    }
  }

  if (Object.hasOwn(payload, "status")) {
    if (!["active", "inactive"].includes(payload.status)) {
      throw new Error("Invalid listing status.");
    }
    update.status = payload.status;
  }

  return update;
}

export function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}
