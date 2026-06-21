import {
  getValidLinkedInAccessToken,
  isLinkedInAppConfigured,
  isLinkedInConnected,
  resolveLinkedInAuthorUrn,
  getLinkedInOrganizationUrn,
} from "./linkedin-connection.js";

export {
  isLinkedInAppConfigured,
  isLinkedInConnected,
  getLinkedInOrganizationUrn,
};

function getLinkedInApiVersion() {
  return process.env.LINKEDIN_API_VERSION?.trim() || "202502";
}

/**
 * Publica un post de solo texto en LinkedIn (Posts API).
 * @returns {{ externalId: string, note?: string }}
 */
export async function publishToLinkedIn(content) {
  const text = String(content || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  if (!text) {
    throw new Error("LinkedIn requiere texto en el post.");
  }

  const accessToken = await getValidLinkedInAccessToken();
  const author = await resolveLinkedInAuthorUrn(accessToken);

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": getLinkedInApiVersion(),
    },
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  const externalId = res.headers.get("x-restli-id");
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error_description ||
      data?.status ||
      `LinkedIn HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!externalId) {
    throw new Error("LinkedIn no devolvió ID del post");
  }

  const orgUrn = getLinkedInOrganizationUrn();
  return {
    externalId,
    note: orgUrn
      ? `Publicado en la página de empresa (${orgUrn}).`
      : undefined,
  };
}
