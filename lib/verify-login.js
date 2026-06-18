import { prisma } from "./prisma";
import { verifyPassword, hashPassword } from "./password";
import { verifyTotpToken } from "./totp";
import {
  normalizeEmail,
  hashIp,
  isLoginBlocked,
  isAccountLocked,
  recordLoginAttempt,
  clearLoginFailures,
  pruneOldLoginAttempts,
} from "./login-security";

function adminEmail() {
  return normalizeEmail(process.env.CRM_ADMIN_EMAIL || "info@dvgsstudio.com");
}

function adminPasswordHash() {
  return process.env.CRM_ADMIN_PASSWORD_HASH || "";
}

async function ensureAdminUser(email, passwordHash) {
  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "DVG CRM Admin",
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name: "DVG CRM Admin",
    },
  });
}

/**
 * @param {{ email: string, password: string, ipHash: string, totp?: string }} input
 */
export async function verifyLoginCredentials({ email, password, ipHash, totp }) {
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

    if (user.totpEnabled && user.totpSecret) {
      if (!totp || !verifyTotpToken(user.totpSecret, totp)) {
        await recordLoginAttempt({
          email: normalized,
          ipHash,
          success: false,
          userId: user.id,
        });
        return null;
      }
    }

    await recordLoginAttempt({
      email: normalized,
      ipHash,
      success: true,
      userId: user.id,
    });
    await clearLoginFailures(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name || "Usuario CRM",
      role: user.role,
    };
  } catch (err) {
    console.error("[auth] verifyLoginCredentials:", err.message);
    const hashFromEnv =
      normalized === adminEmail() ? adminPasswordHash() : "";
    if (!hashFromEnv) return null;
    const valid = await verifyPassword(password, hashFromEnv);
    if (!valid) return null;
    return {
      id: "env-admin",
      email: normalized,
      name: "DVG CRM Admin",
      role: "ADMIN",
    };
  }
}
