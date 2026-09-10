import { createHmac, randomBytes } from "node:crypto";

const PAIRING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function authSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) throw new Error("AUTH_SECRET is required for Android widget credentials.");
  return value;
}

export function hashAndroidWidgetSecret(purpose: "pairing" | "token", value: string) {
  return createHmac("sha256", authSecret())
    .update(`acadia-android-widget:${purpose}:${value}`, "utf8")
    .digest("hex");
}

export function normalizeAndroidPairingCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, "");
}

export function createAndroidPairingCode() {
  const bytes = randomBytes(8);
  const compact = Array.from(bytes, (value) => PAIRING_ALPHABET[value & 31]).join("");
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}
