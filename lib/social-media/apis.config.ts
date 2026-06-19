// lib/social-media/apis.config.ts
// Configuración SOLO PARA X (Twitter)

export const SOCIAL_APIS = {
  X: {
    endpoint: "https://api.twitter.com/2",
    auth: {
      consumerKey: process.env.X_CONSUMER_KEY || "",
      consumerSecret: process.env.X_CONSUMER_SECRET || "",
      accessToken: process.env.X_ACCESS_TOKEN || "",
      accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || "",
    },
    features: {
      tweet: true,
      thread: true,
      media: false,
      schedule: false,
    },
    active: !!process.env.X_CONSUMER_KEY,
  },

  TIKTOK: {
    active: false,
    reason: "No API access available",
  },

  INSTAGRAM: {
    active: false,
    reason: "Requires Facebook Business Account",
  },

  LINKEDIN: {
    active: false,
    reason: "No API access available",
  },
};

// Status
export const getActiveProviders = () => {
  return Object.entries(SOCIAL_APIS)
    .filter(([_, config]: any) => config.active)
    .map(([platform]) => platform);
};

// ✅ ACTIVO: Solo X (Twitter)
// ❌ INACTIVOS: TikTok, Instagram, LinkedIn (sin APIs)
