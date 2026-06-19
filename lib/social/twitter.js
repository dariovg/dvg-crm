import { TwitterApi } from "twitter-api-v2";
import { getPlatformLimit } from "./platform-limits.js";

export function isTwitterConfigured() {
  return !!(
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_TOKEN_SECRET
  );
}

export async function publishToTwitter(content) {
  if (!isTwitterConfigured()) {
    throw new Error(
      "X/Twitter API no configurada. Añade X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN y X_ACCESS_TOKEN_SECRET en Vercel."
    );
  }

  const limit = getPlatformLimit("TWITTER");
  if (content.length > limit) {
    throw new Error(`El tweet supera ${limit} caracteres (${content.length}).`);
  }

  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

  const { data } = await client.v2.tweet(content.trim());
  return {
    externalId: data.id,
    url: `https://x.com/i/web/status/${data.id}`,
  };
}
