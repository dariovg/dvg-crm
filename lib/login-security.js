import crypto from "crypto";
import { prisma } from "./prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const LOCKOUT_AFTER = 10;
const LOCKOUT_MS = 30 * 60 * 1000;

export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

export function hashIp(ip) {
  const salt = process.env.NEXTAUTH_SECRET || "dvg-crm-ip-salt";
  return crypto.createHmac("sha256", salt).update(ip || "unknown").digest("hex");
}

export function getClientIp(headers) {
  if (!headers) return "unknown";
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

export async function isLoginBlocked(email, ipHash) {
  const since = new Date(Date.now() - WINDOW_MS);
  const recentFails = await prisma.loginAttempt.count({
    where: {
      email,
      ipHash,
      success: false,
      createdAt: { gte: since },
    },
  });
  return recentFails >= MAX_ATTEMPTS_PER_WINDOW;
}

export async function isAccountLocked(user) {
  if (!user?.lockedUntil) return false;
  if (user.lockedUntil > new Date()) return true;
  await prisma.user.update({
    where: { id: user.id },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  });
  return false;
}

export async function recordLoginAttempt({ email, ipHash, success, userId }) {
  await prisma.loginAttempt.create({
    data: { email, ipHash, success, userId: userId || null },
  });

  if (!success && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const attempts = user.failedLoginAttempts + 1;
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= LOCKOUT_AFTER
            ? new Date(Date.now() + LOCKOUT_MS)
            : user.lockedUntil,
      },
    });
  }
}

export async function clearLoginFailures(userId) {
  if (!userId) return;
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

/** Elimina intentos de login antiguos (privacidad + tamaño de tabla). */
export async function pruneOldLoginAttempts() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}
