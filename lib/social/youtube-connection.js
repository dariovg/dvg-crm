import crypto from "crypto";
import { prisma } from "../prisma.js";

const PLATFORM = "YOUTUBE";

export function getYouTubeClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${process.env.NEXTAUTH_URL?.replace(/\/$/, "")}/api/marketing/connect/youtube/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function getYouTubeScopes() {
  return (
    process.env.YOUTUBE_SCOPES?.trim() ||
    "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
  );
}

export function isYouTubeAppConfigured() {
  const { clientId, clientSecret, redirectUri } = getYouTubeClientConfig();
  return !!(clientId && clientSecret && redirectUri);
}

export async function getYouTubeConnection() {
  return prisma.socialConnection.findUnique({ where: { platform: PLATFORM } });
}

export async function isYouTubeConnected() {
  const conn = await getYouTubeConnection();
  if (conn?.accessToken) return true;
  return !!process.env.YOUTUBE_ACCESS_TOKEN?.trim();
}

async function exchangeToken(bodyParams) {
  const { clientId, clientSecret } = getYouTubeClientConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...bodyParams,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
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
      data.error_description || data.error || "Error OAuth YouTube"
    );
  }
  return data;
}

async function fetchYouTubeChannelId(accessToken) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json().catch(() => ({}));
  const channelId = data?.items?.[0]?.id;
  if (!res.ok || !channelId) {
    throw new Error(
      data?.error?.message ||
        "No se encontró canal de YouTube en la cuenta autorizada."
    );
  }
  return String(channelId);
}

export async function saveYouTubeTokens(tokenPayload, accessTokenOverride) {
  const accessToken = accessTokenOverride || tokenPayload.access_token;
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
    : null;

  let openId = tokenPayload.open_id || null;
  if (!openId && accessToken) {
    try {
      openId = await fetchYouTubeChannelId(accessToken);
    } catch {
      // Se puede reconectar si falta el canal al publicar
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

export async function exchangeYouTubeCode(code) {
  const { redirectUri } = getYouTubeClientConfig();
  const data = await exchangeToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  await saveYouTubeTokens(data);
  return data;
}

export async function refreshYouTubeAccessToken(refreshToken) {
  const data = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  await saveYouTubeTokens(data, data.access_token);
  return data.access_token;
}

/** Access token válido (BD o env, con refresh automático). */
export async function getValidYouTubeAccessToken() {
  const envToken = process.env.YOUTUBE_ACCESS_TOKEN?.trim();
  const conn = await getYouTubeConnection();

  if (!conn) {
    if (envToken) return envToken;
    throw new Error(
      "YouTube no conectado. Ve a Marketing → Conexiones y autoriza tu canal."
    );
  }

  const stale =
    conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (!stale) return conn.accessToken;

  if (!conn.refreshToken) {
    throw new Error(
      "Token YouTube expirado. Vuelve a conectar en Marketing → Conexiones."
    );
  }

  return refreshYouTubeAccessToken(conn.refreshToken);
}

export function buildYouTubeAuthorizeUrl({ state } = {}) {
  const { clientId, redirectUri } = getYouTubeClientConfig();
  const scope = getYouTubeScopes();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: state || crypto.randomBytes(16).toString("hex"),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
