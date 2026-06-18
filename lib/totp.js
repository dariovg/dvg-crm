import { authenticator } from "otplib";

authenticator.options = { window: 1 };

export function generateTotpSecret() {
  return authenticator.generateSecret();
}

export function getTotpUri(secret, email) {
  return authenticator.keyuri(email, "DVG CRM", secret);
}

export function verifyTotpToken(secret, token) {
  if (!secret || !token) return false;
  return authenticator.verify({ token: String(token).replace(/\s/g, ""), secret });
}
