// components/marketing/SocialPostCard.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PostMetrics {
  likes?: number;
  shares?: number;
  comments?: number;
  impressions?: number;
}

interface SocialPostCardProps {
  post: {
    id: string;
    content: string;
    platform: string;
    status: string;
    createdAt: string;
    publishedAt?: string | null;
    scheduledAt?: string | null;
    imageUrl?: string;
    mediaUrls?: string[];
    createdBy?: { name: string; email?: string } | null;
    campaign?: { name: string };
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    metrics?: PostMetrics;
  };
  showMetrics?: boolean;
}

const platformColors: Record<string, string> = {
  TWITTER: 'bg-blue-100 text-blue-800',
  LINKEDIN: 'bg-blue-600 text-white',
  INSTAGRAM: 'bg-pink-100 text-pink-800',
  FACEBOOK: 'bg-blue-50 text-blue-600',
  TIKTOK: 'bg-gray-900 text-white',
};

const platformIcons: Record<string, string> = {
  TWITTER: '𝕏',
  LINKEDIN: 'in',
  INSTAGRAM: '📷',
  FACEBOOK: 'f',
  TIKTOK: '🎵',
};

const statusBadges: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  SCHEDULED: 'bg-purple-100 text-purple-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function SocialPostCard({
  post,
  showMetrics = false,
}: SocialPostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const imageUrl = post.imageUrl || post.mediaUrls?.[0];
  const metrics: PostMetrics = post.metrics ?? {
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    impressions: post.impressions,
  };
  const hasMetrics =
    (metrics.likes ?? 0) +
      (metrics.comments ?? 0) +
      (metrics.shares ?? 0) +
      (metrics.impressions ?? 0) >
    0;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                platformColors[post.platform] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {platformIcons[post.platform] ?? '•'} {post.platform}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                statusBadges[post.status] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {post.status}
            </span>
          </div>

          <p className="text-gray-700 mb-3 text-base leading-relaxed">
            {post.content}
          </p>

          {imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden max-h-64 bg-gray-100">
              <img
                src={imageUrl}
                alt="Post"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {post.mediaUrls?.some((u) => /\.mp3(\?|$)/i.test(u)) &&
            post.mediaUrls
              .filter((u) => /\.mp3(\?|$)/i.test(u))
              .map((audioUrl) => (
                <audio
                  key={audioUrl}
                  controls
                  src={audioUrl}
                  className="w-full mb-3"
                  preload="metadata"
                />
              ))}

          {post.mediaUrls?.some(
            (u) => !/\.mp3(\?|$)/i.test(u) && /^https?:\/\//i.test(u)
          ) &&
            post.mediaUrls
              .filter(
                (u) => !/\.mp3(\?|$)/i.test(u) && /^https?:\/\//i.test(u)
              )
              .map((videoUrl) => (
                <p key={videoUrl} className="text-sm text-green-700 mb-2">
                  🎬{" "}
                  <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
                    Vídeo enlazado
                  </a>
                </p>
              ))}

          {post.scheduledAt && (
            <p className="text-sm text-purple-700 mb-2">
              📅 Programado:{" "}
              {new Date(post.scheduledAt).toLocaleString("es-ES")}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {post.createdBy?.name && (
              <div>
                <span className="font-semibold">Autor:</span> {post.createdBy.name}
              </div>
            )}
            {post.campaign && (
              <div>
                <span className="font-semibold">Campaña:</span> {post.campaign.name}
              </div>
            )}
            <div>
              <span className="font-semibold">Creado:</span> {timeAgo}
            </div>
          </div>
        </div>
      </div>

      {(showMetrics || hasMetrics) && (
        <div className="border-t pt-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.impressions || 0}
            </div>
            <div className="text-xs text-gray-600">Impresiones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.likes || 0}
            </div>
            <div className="text-xs text-gray-600">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.comments || 0}
            </div>
            <div className="text-xs text-gray-600">Comentarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.shares || 0}
            </div>
            <div className="text-xs text-gray-600">Compartidos</div>
          </div>
        </div>
      )}
    </div>
  );
}
