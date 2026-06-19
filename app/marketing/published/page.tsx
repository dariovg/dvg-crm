// app/marketing/published/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SocialPostCard } from "@/components/marketing/SocialPostCard";

interface Post {
  id: string;
  platform: string;
  content: string;
  status: string;
  createdBy: { name: string } | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  mediaUrls: string[];
  createdAt: string;
  publishedAt: string | null;
}

export default function PublishedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(
          "/api/marketing/posts?status=PUBLISHED&limit=100"
        );
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((p) => p.platform === filter);

  const platforms = ["all", ...new Set(posts.map((p) => p.platform))];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">✅ Published Posts</h1>
        <p className="text-gray-600">History of all published social media content</p>
      </div>

      {/* Platform filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setFilter(platform)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filter === platform
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {platform === "all" ? "All Platforms" : platform}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No published posts yet</p>
          <p className="text-gray-400">Start creating and approving content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Summary stats */}
      {filteredPosts.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-4">📊 Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xl font-bold">{filteredPosts.length}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-xl font-bold">
                {filteredPosts
                  .reduce((acc, p) => acc + p.likes, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Likes</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-xl font-bold">
                {filteredPosts
                  .reduce((acc, p) => acc + p.impressions, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Impressions</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-xl font-bold">
                {(
                  (filteredPosts.reduce((acc, p) => acc + p.likes, 0) /
                    Math.max(
                      filteredPosts.reduce((acc, p) => acc + p.impressions, 0),
                      1
                    )) *
                  100
                ).toFixed(2)}
                %
              </p>
              <p className="text-sm text-gray-600">Engagement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
