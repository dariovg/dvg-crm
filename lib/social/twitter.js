import { TwitterApi } from "twitter-api-v2";
import { getPlatformLimit } from "./platform-limits.js";

function env(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export function getTwitterEnv() {
  return {
    appKey: env("X_API_KEY") || env("X_CONSUMER_KEY"),
    appSecret: env("X_API_SECRET") || env("X_CONSUMER_SECRET"),
    accessToken: env("X_ACCESS_TOKEN"),
    accessSecret: env("X_ACCESS_TOKEN_SECRET"),
  };
}

export function getTwitterConfigDiagnostics() {
  const { appKey, appSecret, accessToken, accessSecret } = getTwitterEnv();
  const missing = [];
  if (!appKey) missing.push("X_API_KEY o X_CONSUMER_KEY");
  if (!appSecret) missing.push("X_API_SECRET o X_CONSUMER_SECRET");
  if (!accessToken) missing.push("X_ACCESS_TOKEN");
  if (!accessSecret) missing.push("X_ACCESS_TOKEN_SECRET");
  return { ready: missing.length === 0, missing };
}

export function isTwitterConfigured() {
  return getTwitterConfigDiagnostics().ready;
}

function formatTwitterError(err) {
  const code = err?.code ?? err?.data?.status;
  const detail =
    err?.data?.detail ||
    err?.data?.title ||
    err?.data?.errors?.[0]?.message ||
    err?.message ||
    "Error desconocido de X API";

  if (
    /oauth1.*permissions|not permitted|read-only|write/i.test(String(detail)) ||
    code === 403
  ) {
    return `${detail} — En developer.x.com: App → Settings → User authentication → permisos Read and write, y regenera Access Token + Secret.`;
  }

  return String(detail).slice(0, 400);
}

export async function publishToTwitter(content) {
  if (!isTwitterConfigured()) {
    throw new Error(
      "X/Twitter API no configurada. En Vercel: X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN y X_ACCESS_TOKEN_SECRET (o X_API_KEY / X_API_SECRET)."
    );
  }

  const limit = getPlatformLimit("TWITTER");
  if (content.length > limit) {
    throw new Error(`El tweet supera ${limit} caracteres (${content.length}).`);
  }

  const { appKey, appSecret, accessToken, accessSecret } = getTwitterEnv();
  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });

  const text = content.trim();
  if (!text) {
    throw new Error("El post está vacío — no se puede publicar un tweet sin texto.");
  }

  try {
    const { data } = await client.v2.tweet(text);
    return {
      externalId: data.id,
      url: `https://x.com/i/web/status/${data.id}`,
    };
  } catch (v2Err) {
    try {
      const legacy = await client.v1.tweet(text);
      const id = legacy.id_str || String(legacy.id);
      return {
        externalId: id,
        url: `https://x.com/i/web/status/${id}`,
      };
    } catch (v1Err) {
      throw new Error(formatTwitterError(v1Err?.data ? v1Err : v2Err));
    }
  }
}

/** Prueba credenciales sin publicar (solo admin/diagnóstico). */
export async function verifyTwitterCredentials() {
  if (!isTwitterConfigured()) {
    return getTwitterConfigDiagnostics();
  }
  const { appKey, appSecret, accessToken, accessSecret } = getTwitterEnv();
  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
  try {
    const me = await client.v2.me();
    return {
      ready: true,
      missing: [],
      username: me.data.username,
    };
  } catch (v2Err) {
    try {
      const legacy = await client.v1.verifyCredentials();
      return {
        ready: true,
        missing: [],
        username: legacy.screen_name,
      };
    } catch (v1Err) {
      const err = v1Err?.data ? v1Err : v2Err;
      const msg =
        err?.data?.detail ||
        err?.data?.title ||
        err?.data?.errors?.[0]?.message ||
        err?.message ||
        "Error al verificar X API";
      return {
        ready: false,
        missing: [],
        error: String(msg).slice(0, 300),
      };
    }
  }
}
