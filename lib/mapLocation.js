const COORDINATE_PAIR = /(-?\d{1,3}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)/;

export function isValidCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export function parseMapCoordinates(value) {
  const input = String(value || "").trim();
  if (!input) return null;

  let decoded = input;
  try {
    decoded = decodeURIComponent(input.replace(/\+/g, "%20"));
  } catch {
    // Keep the original input when it contains malformed URL encoding.
  }

  const candidates = [
    decoded.match(/@(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/),
    decoded.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/),
    decoded.match(COORDINATE_PAIR),
  ];

  for (const match of candidates) {
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidCoordinates(lat, lng)) return { lat, lng };
  }

  try {
    const url = new URL(input);
    for (const key of ["query", "q", "ll", "center", "destination"]) {
      const match = url.searchParams.get(key)?.match(COORDINATE_PAIR);
      if (!match) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isValidCoordinates(lat, lng)) return { lat, lng };
    }
  } catch {
    return null;
  }

  return null;
}
