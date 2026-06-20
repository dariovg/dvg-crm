import { randomBytes } from "crypto";

export function generateShareToken() {
  return randomBytes(24).toString("base64url");
}

export function publicQuotePath(token) {
  return `/p/${token}`;
}

export function publicSignPath(token) {
  return `/p/${token}/firmar`;
}

export function absolutePublicQuoteUrl(token, origin) {
  const base = origin || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base.replace(/\/$/, "")}${publicQuotePath(token)}`;
}

export function absolutePublicSignUrl(token, origin) {
  const base = origin || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base.replace(/\/$/, "")}${publicSignPath(token)}`;
}
