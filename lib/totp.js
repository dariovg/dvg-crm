import { authenticator } from "otplib";
import { APP_DISPLAY_NAME } from "./app-brand.js";

authenticator.options = { window: 1 };

export function generateTotpSecret() {
  return authenticator.generateSecret();
}

export function getTotpUri(secret, email) {
  return authenticator.keyuri(email, APP_DISPLAY_NAME, secret);
}

export function verifyTotpToken(secret, token) {
  if (!secret || !token) return false;
  return authenticator.verify({ token: String(token).replace(/\s/g, ""), secret });
}
