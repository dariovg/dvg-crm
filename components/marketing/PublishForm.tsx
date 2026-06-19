// components/marketing/PublishForm.tsx
"use client";

import { useState } from "react";
import { SocialPlatform } from "@prisma/client";

interface PublishFormProps {
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
}

const PLATFORMS: { value: SocialPlatform; label: string; icon: string }[] = [
  { value: "TWITTER", label: "Twitter/X", icon: "𝕏" },
  { value: "INSTAGRAM", label: "Instagram", icon: "📷" },
  { value: "TIKTOK", label: "TikTok", icon: "🎵" },
  { value: "LINKEDIN", label: "LinkedIn", icon: "💼" },
  { value: "FACEBOOK", label: "Facebook", icon: "f" },
];

export function PublishForm({ onSubmit, onCancel }: PublishFormProps) {
  const [formData, setFormData] = useState({
    platform: "TWITTER" as SocialPlatform,
    content: "",
    campaignId: "",
    scheduledAt: "",
    mediaUrls: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/marketing/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formData.platform,
          content: formData.content,
          campaignId: formData.campaignId || null,
          scheduledAt: formData.scheduledAt || null,
          mediaUrls: formData.mediaUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      setSuccess(true);
      setFormData({
        platform: "TWITTER",
        content: "",
        campaignId: "",
        scheduledAt: "",
        mediaUrls: [],
      });

      if (onSubmit) {
        await onSubmit(formData);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-6">📝 Create New Post</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
          Post created successfully! Waiting for approval.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Platform selection */}
        <div>
          <label className="block text-sm font-semibold mb-2">Platform</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, platform: p.value })
                }
                className={`p-2 rounded border-2 text-center transition-all ${
                  formData.platform === p.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <p className="text-xs font-semibold">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Content
            <span className="text-gray-500 font-normal">
              {" "}
              ({formData.content.length} chars)
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="What's on your mind?"
            maxLength={5000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            required
          />
        </div>

        {/* Scheduled date/time */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) =>
              setFormData({ ...formData, scheduledAt: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Campaign ID (optional) */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Campaign ID (optional)
          </label>
          <input
            type="text"
            value={formData.campaignId}
            onChange={(e) =>
              setFormData({ ...formData, campaignId: e.target.value })
            }
            placeholder="Link to a campaign"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading || !formData.content.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded transition-colors"
          >
            {loading ? "Creating..." : "Create Post"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
