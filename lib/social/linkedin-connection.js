import crypto from "crypto";
import { prisma } from "../prisma.js";

const PLATFORM = "LINKEDIN";

export function getLinkedInClientConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    `${process.env.NEXTAUTH_URL?.replace(/\/$/, "")}/api/marketing/connect/linkedin/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function getLinkedInOrganizationUrn() {
  const raw = process.env.LINKEDIN_ORGANIZATION_URN?.trim() || "";
  if (!raw) return null;
  if (raw.startsWith("urn:li:organization:")) return raw;
  const id = raw.replace(/^organization:/i, "").replace(/\D/g, "");
  return id ? `urn:li:organization:${id}` : null;
}

export function getLinkedInScopes() {
  const base = (
    process.env.LINKEDIN_SCOPES || "openid profile w_member_social"
  ).trim();
  if (getLinkedInOrganizationUrn()) {
    const parts = new Set(base.split(/\s+/).filter(Boolean));
    parts.add("w_organization_social");
    return [...parts].join(" ");
  }
  return base;
}

export function isLinkedInAppConfigured() {
  const { clientId, clientSecret, redirectUri } = getLinkedInClientConfig();
  return !!(clientId && clientSecret && redirectUri);
}

export async function getLinkedInConnection() {
  return prisma.socialConnection.findUnique({ where: { platform: PLATFORM } });
}

export async function isLinkedInConnected() {
  const conn = await getLinkedInConnection();
  if (conn?.accessToken) return true;
  return !!process.env.LINKEDIN_ACCESS_TOKEN?.trim();
}

async function exchangeToken(bodyParams) {
  const { clientId, clientSecret } = getLinkedInClientConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...bodyParams,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      data.error_description || data.error || "Error OAuth LinkedIn"
    );
  }
  return data;
}

async function fetchLinkedInMemberSub(accessToken) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.sub) {
    throw new Error(
      data.message || data.error_description || "No se pudo obtener perfil LinkedIn"
    );
  }
  return String(data.sub);
}

export async function saveLinkedInTokens(tokenPayload, accessTokenOverride) {
  const accessToken = accessTokenOverride || tokenPayload.access_token;
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
    : null;

  let openId = tokenPayload.open_id || null;
  if (!openId && accessToken) {
    try {
      openId = await fetchLinkedInMemberSub(accessToken);
    } catch {
      // Se puede reconectar si falta el sub al publicar
    }
  }

  return prisma.socialConnection.upsert({
    where: { platform: PLATFORM },
    create: {
      platform: PLATFORM,
      accessToken,
      refreshToken: tokenPayload.refresh_token || null,
      openId,
      scope: tokenPayload.scope || null,
      expiresAt,
    },
    update: {
      accessToken,
      refreshToken: tokenPayload.refresh_token || undefined,
      openId: openId || undefined,
      scope: tokenPayload.scope || undefined,
      expiresAt,
    },
  });
}

export async function exchangeLinkedInCode(code) {
  const { redirectUri } = getLinkedInClientConfig();
  const data = await exchangeToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  await saveLinkedInTokens(data);
  return data;
}

export async function refreshLinkedInAccessToken(refreshToken) {
  const data = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  await saveLinkedInTokens(data);
  return data.access_token;
}

/** Access token válido (BD o env, con refresh automático). */
export async function getValidLinkedInAccessToken() {
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const conn = await getLinkedInConnection();

  if (!conn) {
    if (envToken) return envToken;
    throw new Error(
      "LinkedIn no conectado. Ve a Marketing → Resumen y autoriza tu cuenta."
    );
  }

  const stale =
    conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (!stale) return conn.accessToken;

  if (!conn.refreshToken) {
    throw new Error(
      "Token LinkedIn expirado. Vuelve a conectar en Marketing → Resumen."
    );
  }

  return refreshLinkedInAccessToken(conn.refreshToken);
}

export function generatePkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function buildLinkedInAuthorizeUrl({ state, codeChallenge } = {}) {
  const { clientId, redirectUri } = getLinkedInClientConfig();
  const scope = getLinkedInScopes();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: state || crypto.randomBytes(16).toString("hex"),
  });

  if (codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/** URN del autor del post: organización (env) o persona conectada. */
export async function resolveLinkedInAuthorUrn(accessToken) {
  const orgUrn = getLinkedInOrganizationUrn();
  if (orgUrn) return orgUrn;

  const conn = await getLinkedInConnection();
  let personId = conn?.openId;
  if (!personId) {
    personId = await fetchLinkedInMemberSub(accessToken);
    if (conn) {
      await prisma.socialConnection.update({
        where: { platform: PLATFORM },
        data: { openId: personId },
      });
    }
  }

  return `urn:li:person:${personId}`;
}
