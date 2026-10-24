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

const STAY_TIERS = new Set(["Royal", "Classic", "Easy"]);
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
  "shareExactLocation",
  "cleaningFee",
  "images",
  "address",
  "city",
  "pincode",
  "tourismLicenseId",
];

export function toPublicProperty(property) {
  const {
    ownerUid,
    ownerEmail,
    address,
    latitude,
    longitude,
    mapLatitude,
    mapLongitude,
    shareExactLocation,
    pincode,
    verificationNotes,
    ...publicData
  } = property;
  const mapCoordinates =
    shareExactLocation &&
    Number.isFinite(Number(mapLatitude)) &&
    Number.isFinite(Number(mapLongitude)) &&
    Math.abs(Number(mapLatitude)) <= 90 &&
    Math.abs(Number(mapLongitude)) <= 180
      ? { lat: Number(mapLatitude), lng: Number(mapLongitude) }
      : null;

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
    shareExactLocation: Boolean(shareExactLocation),
    mapCoordinates,
  };
}

export function toPropertyUpdate(payload) {
  if (
    Object.hasOwn(payload, "tourismLicenseId") &&
    (typeof payload.tourismLicenseId !== "string" || payload.tourismLicenseId.length > 200)
  ) {
    throw new Error("Tourism license ID must be text under 200 characters.");
  }

  const update = Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => Object.hasOwn(payload, field)).map((field) => [
      field,
      payload[field],
    ])
  );

  if (Object.hasOwn(payload, "lat") || Object.hasOwn(payload, "lng")) {
    const hasLatitude =
      payload.lat !== null &&
      payload.lat !== undefined &&
      !(typeof payload.lat === "string" && payload.lat.trim() === "");
    const hasLongitude =
      payload.lng !== null &&
      payload.lng !== undefined &&
      !(typeof payload.lng === "string" && payload.lng.trim() === "");
    if (hasLatitude !== hasLongitude) {
      throw new Error("Both latitude and longitude are required.");
    }
    if (hasLatitude) {
      if (
        !["number", "string"].includes(typeof payload.lat) ||
        !["number", "string"].includes(typeof payload.lng)
      ) {
        throw new Error("Valid latitude and longitude are required.");
      }
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
    } else {
      update.latitude = null;
      update.longitude = null;
    }
  }

  if (Object.hasOwn(payload, "shareExactLocation")) {
    if (typeof payload.shareExactLocation !== "boolean") {
      throw new Error("Choose whether to share the exact map location.");
    }
    update.shareExactLocation = payload.shareExactLocation;
  }
  if (
    update.shareExactLocation === true &&
    Object.hasOwn(payload, "lat") &&
    (update.latitude == null || update.longitude == null)
  ) {
    throw new Error("Add a property location before saving its public map pin.");
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
