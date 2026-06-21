/** URL pública del post según plataforma e ID externo. */
export function buildPublishedPostUrl(platform, externalId) {
  if (!externalId) return null;
  switch (platform) {
    case "TWITTER":
      return `https://x.com/i/web/status/${externalId}`;
    case "YOUTUBE":
      return `https://www.youtube.com/watch?v=${externalId}`;
    case "TIKTOK":
      return externalId.startsWith("http")
        ? externalId
        : `https://www.tiktok.com/@_/video/${externalId}`;
    case "LINKEDIN":
      return externalId.startsWith("http")
        ? externalId
        : `https://www.linkedin.com/feed/update/${externalId}`;
    default:
      return null;
  }
}
