import { createHmac, timingSafeEqual } from "node:crypto";

export const MAINTENANCE_COOKIE = "mehmaan_maintenance_access";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;

function constantTimeEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual || "");
  const expectedBuffer = Buffer.from(expected || "");
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
}

function getSessionSecret() {
  const secret = process.env.MAINTENANCE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Configure MAINTENANCE_SESSION_SECRET with at least 32 characters.");
  }
  return secret;
}

function signature(payload) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function verifyMaintenanceCredentials(email, password) {
  const expectedEmail = process.env.MAINTENANCE_ADMIN_EMAIL;
  const expectedPassword = process.env.MAINTENANCE_ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    throw new Error("Configure the developer maintenance credentials in the server environment.");
  }
  getSessionSecret();
  return constantTimeEqual(String(email || "").trim().toLowerCase(), expectedEmail.trim().toLowerCase()) &&
    constantTimeEqual(String(password || ""), expectedPassword);
}

export function createMaintenanceSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const payload = String(expiresAt);
  return { value: `${payload}.${signature(payload)}`, expiresAt };
}

export function isMaintenanceSessionValid(value) {
  if (!value || typeof value !== "string") return false;
  const [payload, providedSignature, ...extra] = value.split(".");
  if (!payload || !providedSignature || extra.length > 0) return false;
  const expiresAt = Number(payload);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(providedSignature, signature(payload));
}
