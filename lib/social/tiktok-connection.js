import crypto from "crypto";
import { prisma } from "../prisma.js";

const PLATFORM = "TIKTOK";

function env(name) {
  const raw = process.env[name];
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

export function getTikTokClientConfig() {
  const clientKey =
    env("TIKTOK_CLIENT_KEY") ||
    env("TIKTOK_APP_KEY") ||
    env("TIKTOK_APP_ID") ||
    env("TIKTOK_CLIENT_ID");
  const clientSecret =
    env("TIKTOK_CLIENT_SECRET") ||
    env("TIKTOK_APP_SECRET") ||
    env("TIKTOK_CLIENT_ID_SECRET");
  const baseUrl =
    env("NEXTAUTH_URL") ||
    (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "") ||
    "https://crm.dvgsstudio.com";
  const redirectUri =
    env("TIKTOK_REDIRECT_URI") ||
    `${baseUrl.replace(/\/$/, "")}/api/marketing/connect/tiktok/callback`;

  return { clientKey, clientSecret, redirectUri };
}

export function getTikTokConfigDiagnostics() {
  const { clientKey, clientSecret, redirectUri } = getTikTokClientConfig();
  const missing = [];
  if (!clientKey) {
    missing.push("TIKTOK_CLIENT_KEY (Client Key del portal TikTok for Developers)");
  } else if (clientKey.length < 8) {
    missing.push("TIKTOK_CLIENT_KEY demasiado corta — revisa que copiaste el Client Key, no el Secret");
  }
  if (!clientSecret) {
    missing.push("TIKTOK_CLIENT_SECRET");
  }
  if (!redirectUri) {
    missing.push("TIKTOK_REDIRECT_URI o NEXTAUTH_URL");
  }
  return {
    ready: missing.length === 0,
    missing,
    redirectUri,
    clientKeyPreview: clientKey ? `${clientKey.slice(0, 4)}…${clientKey.slice(-4)}` : null,
    clientKeyLength: clientKey.length || 0,
  };
}

export function isTikTokAppConfigured() {
  return getTikTokConfigDiagnostics().ready;
}

export async function getTikTokConnection() {
  return prisma.socialConnection.findUnique({ where: { platform: PLATFORM } });
}

export async function isTikTokConnected() {
  const conn = await getTikTokConnection();
  if (conn?.accessToken) return true;
  return !!process.env.TIKTOK_ACCESS_TOKEN?.trim();
}

async function exchangeToken(bodyParams) {
  const { clientKey, clientSecret } = getTikTokClientConfig();
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    ...bodyParams,
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
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
      data.error_description || data.error || "Error OAuth TikTok"
    );
  }
  return data;
}

export async function saveTikTokTokens(tokenPayload) {
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
    : null;

  return prisma.socialConnection.upsert({
    where: { platform: PLATFORM },
    create: {
      platform: PLATFORM,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token || null,
      openId: tokenPayload.open_id || null,
      scope: tokenPayload.scope || null,
      expiresAt,
    },
    update: {
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token || undefined,
      openId: tokenPayload.open_id || undefined,
      scope: tokenPayload.scope || undefined,
      expiresAt,
    },
  });
}

export async function exchangeTikTokCode(code, codeVerifier) {
  const { redirectUri } = getTikTokClientConfig();
  const params = {
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };
  if (codeVerifier) params.code_verifier = codeVerifier;

  const data = await exchangeToken(params);
  await saveTikTokTokens(data);
  return data;
}

export async function refreshTikTokAccessToken(refreshToken) {
  const data = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  await saveTikTokTokens(data);
  return data.access_token;
}

/** Access token válido (BD o env, con refresh automático). */
export async function getValidTikTokAccessToken() {
  const envToken = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  const conn = await getTikTokConnection();

  if (!conn) {
    if (envToken) return envToken;
    throw new Error(
      "TikTok no conectado. Ve a Marketing → Resumen y autoriza tu cuenta."
    );
  }

  const stale =
    conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (!stale) return conn.accessToken;

  if (!conn.refreshToken) {
    throw new Error(
      "Token TikTok expirado. Vuelve a conectar en Marketing → Resumen."
    );
  }

  return refreshTikTokAccessToken(conn.refreshToken);
}

export function generatePkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function buildTikTokAuthorizeUrl({ state, codeChallenge }) {
  const { clientKey, redirectUri } = getTikTokClientConfig();
  const scope = (
    process.env.TIKTOK_SCOPES || "user.info.basic,video.publish,video.upload"
  ).trim();

  const params = new URLSearchParams({
    client_key: clientKey,
    scope,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}
