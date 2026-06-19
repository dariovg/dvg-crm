// components/marketing/AnalyticsWidget.tsx
"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  postsCount: number;
  byPlatform: Record<
    string,
    {
      count: number;
      impressions: number;
      likes: number;
      engagement: number;
    }
  >;
}

interface AnalyticsWidgetProps {
  platform?: string;
  campaignId?: string;
}

export function AnalyticsWidget({ platform, campaignId }: AnalyticsWidgetProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const params = new URLSearchParams();
        if (platform) params.set("platform", platform);
        if (campaignId) params.set("campaignId", campaignId);

        const response = await fetch(`/api/marketing/analytics?${params}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [platform, campaignId]);

  if (loading) {
    return <div className="text-center py-6 text-gray-500">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-6 text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold mb-6">📊 Analytics</h3>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{analytics.totalImpressions.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Impressions</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{analytics.totalLikes.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Likes</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{analytics.totalComments.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Comments</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">{analytics.totalShares.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Shares</p>
        </div>
      </div>

      {/* Engagement rate and posts count */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-100">
          <p className="text-3xl font-bold text-red-600">
            {analytics.avgEngagementRate.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">Avg Engagement Rate</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
          <p className="text-3xl font-bold text-indigo-600">
            {analytics.postsCount}
          </p>
          <p className="text-sm text-gray-600">Published Posts</p>
        </div>
      </div>

      {/* By platform breakdown */}
      {Object.keys(analytics.byPlatform).length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">By Platform</h4>
          <div className="space-y-3">
            {Object.entries(analytics.byPlatform).map(
              ([platformName, data]) => (
                <div
                  key={platformName}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{platformName}</p>
                    <p className="text-xs text-gray-500">
                      {data.count} posts • {data.impressions.toLocaleString()} impressions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{data.engagement.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
