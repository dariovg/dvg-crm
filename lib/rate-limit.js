import { NextResponse } from "next/server";
import { getClientIp, hashIp } from "./login-security";

const buckets = new Map();

/** @param {string} key */
function pruneBucket(key) {
  const bucket = buckets.get(key);
  if (!bucket) return;
  const now = Date.now();
  bucket.hits = bucket.hits.filter((t) => now - t < bucket.windowMs);
  if (!bucket.hits.length) buckets.delete(key);
}

/**
 * @param {string} key
 * @param {{ limit?: number, windowMs?: number }} [opts]
 */
export function checkRateLimit(key, opts = {}) {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [], windowMs };
    buckets.set(key, bucket);
  }

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.ceil((bucket.hits[0] + windowMs - now) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  bucket.hits.push(now);
  return { ok: true, retryAfter: 0 };
}

/**
 * @param {Request | Headers} reqOrHeaders
 * @param {string} scope
 * @param {{ limit?: number, windowMs?: number }} [opts]
 */
export function rateLimitRequest(reqOrHeaders, scope, opts) {
  const headers =
    reqOrHeaders instanceof Request ? reqOrHeaders.headers : reqOrHeaders;
  const ip = getClientIp(headers);
  const ipHash = hashIp(ip);
  return checkRateLimit(`${scope}:${ipHash}`, opts);
}

/**
 * @param {Request} req
 * @param {string} scope
 * @param {{ limit?: number, windowMs?: number }} [opts]
 */
export function rateLimitResponse(req, scope, opts) {
  const result = rateLimitRequest(req, scope, opts);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Inténtalo más tarde." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }
  );
}

/** Periodic cleanup for long-running Node processes. */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    for (const key of buckets.keys()) pruneBucket(key);
  }, 5 * 60_000);
}
