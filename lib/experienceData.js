export const EXPERIENCE_CATEGORIES = [
  "Water Adventures",
  "Land Adventures",
  "Nature & Wildlife",
  "Cultural Experiences",
  "Wellness & Relaxation",
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ExperienceValidationError extends Error {}

export function isExperienceId(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function formatExperienceDuration(hours) {
  const value = Number(hours);
  if (value < 1) return `${Math.round(value * 60)} mins`;
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${value === 1 ? "hour" : "hours"}`;
}

export function normalizeExperience(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ExperienceValidationError("Provide valid experience details.");
  }

  const requiredText = ["title", "summary", "description", "city", "location"];
  for (const field of requiredText) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      throw new ExperienceValidationError(`Add an experience ${field}.`);
    }
  }
  if (payload.title.trim().length > 120 || payload.summary.trim().length > 280) {
    throw new ExperienceValidationError("Keep the experience title under 120 characters and summary under 280 characters.");
  }
  if (
    payload.description.trim().length > 10000 ||
    (payload.requirements !== undefined &&
      (typeof payload.requirements !== "string" || payload.requirements.length > 3000)) ||
    payload.city.trim().length > 100 ||
    payload.location.trim().length > 160
  ) {
    throw new ExperienceValidationError("Experience details exceed the allowed length.");
  }
  if (!EXPERIENCE_CATEGORIES.includes(payload.category)) {
    throw new ExperienceValidationError("Choose a valid experience category.");
  }

  const duration = Number(payload.duration_hours);
  const price = Number(payload.price_per_person);
  const capacity = Number(payload.capacity);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 72) {
    throw new ExperienceValidationError("Duration must be greater than 0 and no more than 72 hours.");
  }
  if (!Number.isFinite(price) || price <= 0 || price > 10000000) {
    throw new ExperienceValidationError("Enter a valid per-person price.");
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
    throw new ExperienceValidationError("Capacity must be between 1 and 1,000 guests.");
  }

  const images = normalizeTextList(payload.images, "photos", 20, 2048);
  if (payload.status === "published" && images.length === 0) {
    throw new ExperienceValidationError("Add at least one photo before publishing an experience.");
  }
  if (!["draft", "published"].includes(payload.status)) {
    throw new ExperienceValidationError("Choose whether the experience is a draft or published.");
  }
  if (typeof payload.is_featured !== "boolean") {
    throw new ExperienceValidationError("Choose whether the experience is featured.");
  }

  return {
    title: payload.title.trim(),
    summary: payload.summary.trim(),
    description: payload.description.trim(),
    category: payload.category,
    city: payload.city.trim().slice(0, 100),
    location: payload.location.trim().slice(0, 160),
    duration_hours: duration,
    price_per_person: price,
    capacity,
    images,
    highlights: normalizeTextList(payload.highlights, "highlights", 12, 200),
    inclusions: normalizeTextList(payload.inclusions, "inclusions", 20, 200),
    requirements: typeof payload.requirements === "string" ? payload.requirements.trim() : "",
    status: payload.status,
    is_featured: payload.is_featured,
  };
}

function normalizeTextList(value, label, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ExperienceValidationError(`Provide no more than ${maxItems} experience ${label}.`);
  }
  if (value.some((item) => typeof item !== "string" || item.length > maxLength)) {
    throw new ExperienceValidationError(`Each experience ${label} must be text under ${maxLength} characters.`);
  }
  if (label === "photos" && value.some((item) => {
    try {
      const url = new URL(item);
      return url.protocol !== "https:" && url.protocol !== "http:";
    } catch {
      return true;
    }
  })) {
    throw new ExperienceValidationError("Experience photos must use valid HTTP or HTTPS URLs.");
  }
  return value.map((item) => item.trim()).filter(Boolean);
}
