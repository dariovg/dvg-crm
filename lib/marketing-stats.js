import { prisma } from "./prisma.js";

function sumMetric(posts, field) {
  return posts.reduce((acc, post) => acc + (post[field] || 0), 0);
}

export async function getMarketingDashboardStats({ includeLeads = false } = {}) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const leadCountPromise = includeLeads
    ? prisma.contact.count({ where: { createdAt: { gte: since24h } } })
    : Promise.resolve(0);
  const recentLeadsPromise = includeLeads
    ? prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          leadScore: true,
          createdAt: true,
        },
      })
    : Promise.resolve([]);

  const [
    pendingCount,
    approvedCount,
    scheduledCount,
    publishedCount,
    posts7d,
    posts24h,
    newLeads24h,
    recentLeads,
    recentPending,
    recentApproved,
  ] = await Promise.all([
    prisma.socialPost.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.socialPost.count({ where: { status: "APPROVED" } }),
    prisma.socialPost.count({ where: { status: "SCHEDULED" } }),
    prisma.socialPost.count({ where: { status: "PUBLISHED" } }),
    prisma.socialPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since7d } },
      select: { impressions: true, likes: true, comments: true, shares: true },
    }),
    prisma.socialPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since24h } },
      select: { impressions: true, likes: true, comments: true, shares: true },
    }),
    leadCountPromise,
    recentLeadsPromise,
    prisma.socialPost.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        createdBy: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.socialPost.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        createdBy: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    }),
  ]);

  const impressions24h = sumMetric(posts24h, "impressions");
  const likes7d = sumMetric(posts7d, "likes");
  const impressions7d = sumMetric(posts7d, "impressions");
  const engagement7d =
    sumMetric(posts7d, "likes") +
    sumMetric(posts7d, "comments") +
    sumMetric(posts7d, "shares");

  return {
    pendingCount,
    approvedCount,
    scheduledCount,
    publishedCount,
    impressions24h,
    likes7d,
    newLeads24h,
    engagementRate:
      impressions7d > 0
        ? Number(((engagement7d / impressions7d) * 100).toFixed(1))
        : 0,
    ctr:
      impressions7d > 0
        ? Number(((sumMetric(posts7d, "shares") / impressions7d) * 100).toFixed(1))
        : 0,
    recentLeads,
    recentPending,
    recentApproved,
  };
}

export async function getMarketingAnalytics(rangeDays = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - rangeDays);

  const posts = await prisma.socialPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: startDate, lte: now },
    },
  });

  const totalImpressions = sumMetric(posts, "impressions");
  const totalLikes = sumMetric(posts, "likes");
  const totalComments = sumMetric(posts, "comments");
  const totalShares = sumMetric(posts, "shares");
  const totalEngagement = totalLikes + totalComments + totalShares;

  return {
    totalImpressions,
    totalLikes,
    totalComments,
    totalShares,
    engagementRate:
      totalImpressions > 0
        ? Number(((totalEngagement / totalImpressions) * 100).toFixed(1))
        : 0,
    ctr:
      totalImpressions > 0
        ? Number(((totalShares / totalImpressions) * 100).toFixed(1))
        : 0,
    postCount: posts.length,
  };
}
