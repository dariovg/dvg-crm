import { prisma } from "./prisma";
import { DEFAULT_ADMIN_NAME } from "./app-brand.js";
import { verifyPassword, hashPassword } from "./password";
import { recordAudit } from "./audit";
import { createUserSession } from "./session-tracker";
import {
  normalizeEmail,
  isLoginBlocked,
  isAccountLocked,
  recordLoginAttempt,
  clearLoginFailures,
  pruneOldLoginAttempts,
} from "./login-security";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function adminEmail() {
  return normalizeEmail(process.env.CRM_ADMIN_EMAIL || "info@dvgsstudio.com");
}

function adminPasswordHash() {
  return process.env.CRM_ADMIN_PASSWORD_HASH || "";
}

const LEGACY_ADMIN_NAMES = new Set([
  "DVG CRM Admin",
  "App Admin",
  "DVG App Admin",
]);

async function ensureAdminUser(email, passwordHash) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name: DEFAULT_ADMIN_NAME,
    },
  });
  if (LEGACY_ADMIN_NAMES.has(user.name)) {
    return prisma.user.update({
      where: { id: user.id },
      data: { name: DEFAULT_ADMIN_NAME },
    });
  }
  return user;
}

function parseUserAgent(req) {
  return req?.headers?.["user-agent"] || null;
}

/**
 * @param {{ email: string, password: string, ipHash: string, req?: import("http").IncomingMessage }} input
 */
export async function verifyLoginCredentials({ email, password, ipHash, req }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) return null;

  try {
    await pruneOldLoginAttempts();

    if (await isLoginBlocked(normalized, ipHash)) {
      return null;
    }

    let user = await prisma.user.findUnique({ where: { email: normalized } });

    if (await isAccountLocked(user)) {
      return null;
    }

    const hashFromEnv =
      normalized === adminEmail() ? adminPasswordHash() : "";
    const hashToCheck =
      user?.passwordHash || hashFromEnv || null;

    const valid = await verifyPassword(password, hashToCheck);
    if (!valid) {
      await recordLoginAttempt({
        email: normalized,
        ipHash,
        success: false,
        userId: user?.id,
      });
      return null;
    }

    if (normalized === adminEmail() && hashFromEnv) {
      user = await ensureAdminUser(normalized, hashFromEnv);
    } else if (user && !user.passwordHash && password) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      });
    }

    if (!user) return null;

    await recordLoginAttempt({
      email: normalized,
      ipHash,
      success: true,
      userId: user.id,
    });
    await clearLoginFailures(user.id);

    if (user.totpEnabled || user.totpSecret) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
      });
    }

    const session = await createUserSession({
      userId: user.id,
      userAgent: parseUserAgent(req),
      ipHash,
    });

    await recordAudit({
      userId: user.id,
      action: "login",
      summary: `Inicio de sesión: ${user.email}`,
      ipHash,
      payload: { role: user.role },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || DEFAULT_ADMIN_NAME,
      image: user.image,
      profileStatus: user.profileStatus,
      statusMessage: user.statusMessage,
      role: user.role,
      totpEnabled: user.totpEnabled,
      tokenVersion: user.tokenVersion,
      sessionId: session.id,
    };
  } catch (err) {
    console.error("[auth] verifyLoginCredentials:", err.message);

    if (isProduction()) {
      return null;
    }

    const hashFromEnv =
      normalized === adminEmail() ? adminPasswordHash() : "";
    if (!hashFromEnv) return null;
    const valid = await verifyPassword(password, hashFromEnv);
    if (!valid) return null;

    return {
      id: "env-admin",
      email: normalized,
      name: DEFAULT_ADMIN_NAME,
      image: null,
      profileStatus: "AVAILABLE",
      statusMessage: null,
      role: "ADMIN",
      totpEnabled: false,
      tokenVersion: 0,
      sessionId: null,
    };
  }
}
