/** Límites de caracteres por plataforma (orientativos). */
export const PLATFORM_LIMITS = {
  TWITTER: 280,
  INSTAGRAM: 2200,
  TIKTOK: 150,
  LINKEDIN: 3000,
  FACEBOOK: 63206,
};

export function getPlatformLimit(platform) {
  return PLATFORM_LIMITS[platform] ?? 5000;
}

export function isWithinLimit(platform, content) {
  return content.length <= getPlatformLimit(platform);
}
