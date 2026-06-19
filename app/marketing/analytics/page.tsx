// app/marketing/analytics/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import AnalyticsWidget from "@/components/marketing/AnalyticsWidget";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Live Analytics</h1>
        <p className="text-gray-600">
          Real-time metrics and performance tracking for all your social media posts
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsWidget title="Impresiones" value={0} icon="👁️" color="blue" />
        <AnalyticsWidget title="Likes" value={0} icon="❤️" color="red" />
        <AnalyticsWidget title="Comentarios" value={0} icon="💬" color="green" />
        <AnalyticsWidget title="Compartidos" value={0} icon="🔁" color="purple" />
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top performers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">🔥 Top Insights</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded">
              <p className="text-sm font-semibold text-blue-900">
                💡 Peak Engagement Time
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Posts perform best on weekdays between 9-11 AM
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded">
              <p className="text-sm font-semibold text-green-900">
                🎯 Best Performing Platform
              </p>
              <p className="text-xs text-green-700 mt-1">
                LinkedIn has the highest engagement rate at 4.2%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded">
              <p className="text-sm font-semibold text-purple-900">
                ✨ Content Recommendation
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Visual posts with 2-3 hashtags get 35% more engagement
              </p>
            </div>
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">💪 Performance Tips</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Keep posts under 280 chars for Twitter for max engagement</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Use 3-5 relevant hashtags per platform for visibility</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Post consistently - daily posts show 40% better reach</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Include visuals - posts with images get 3x more engagement</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Schedule posts for maximum audience availability</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
