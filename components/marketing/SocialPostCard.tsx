// components/marketing/SocialPostCard.tsx
"use client";

import { SocialPost, User } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface SocialPostCardProps {
  post: SocialPost & { createdBy?: User | null };
  onApprove?: () => void;
  onReject?: () => void;
  isApprover?: boolean;
}

const platformColors: Record<string, string> = {
  TWITTER: "bg-blue-100 text-blue-800",
  INSTAGRAM: "bg-pink-100 text-pink-800",
  TIKTOK: "bg-purple-100 text-purple-800",
  LINKEDIN: "bg-blue-600 text-white",
  FACEBOOK: "bg-blue-500 text-white",
};

const platformIcons: Record<string, string> = {
  TWITTER: "𝕏",
  INSTAGRAM: "📷",
  TIKTOK: "🎵",
  LINKEDIN: "💼",
  FACEBOOK: "f",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-500 text-white",
  FAILED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function SocialPostCard({
  post,
  onApprove,
  onReject,
  isApprover = false,
}: SocialPostCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl px-2 py-1 rounded ${
              platformColors[post.platform] || "bg-gray-100"
            }`}
          >
            {platformIcons[post.platform]}
          </span>
          <div>
            <p className="text-sm font-semibold">{post.platform}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            statusColors[post.status] || "bg-gray-100"
          }`}
        >
          {post.status.replace("_", " ")}
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
      </div>

      {/* Media preview */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mb-3 flex gap-2">
          {post.mediaUrls.slice(0, 3).map((url, idx) => (
            <div
              key={idx}
              className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500"
            >
              📎
            </div>
          ))}
          {post.mediaUrls.length > 3 && (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
              +{post.mediaUrls.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4 py-2 border-t border-b border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold">{post.likes}</p>
          <p className="text-xs text-gray-500">Likes</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{post.comments}</p>
          <p className="text-xs text-gray-500">Comments</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{post.shares}</p>
          <p className="text-xs text-gray-500">Shares</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{post.impressions}</p>
          <p className="text-xs text-gray-500">Impressions</p>
        </div>
      </div>

      {/* Creator info */}
      {post.createdBy && (
        <p className="text-xs text-gray-500 mb-3">
          Created by <span className="font-semibold">{post.createdBy.name}</span>
        </p>
      )}

      {/* Approval buttons */}
      {isApprover && post.status === "PENDING_APPROVAL" && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded transition-colors"
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  );
}
