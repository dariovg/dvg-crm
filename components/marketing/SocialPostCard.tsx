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
    title: string;
    content: string;
    platform: 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
    createdAt: string;
    publishedAt?: string;
    imageUrl?: string;
    createdBy: {
      name: string;
      email: string;
    };
    campaign?: {
      name: string;
    };
    metrics?: PostMetrics;
  };
  showMetrics?: boolean;
}

const platformColors: {
  [key in 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK']: string;
} = {
  TWITTER: 'bg-blue-100 text-blue-800',
  LINKEDIN: 'bg-blue-600 text-white',
  INSTAGRAM: 'bg-pink-100 text-pink-800',
  FACEBOOK: 'bg-blue-50 text-blue-600',
};

const platformIcons: {
  [key in 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK']: string;
} = {
  TWITTER: '𝕏',
  LINKEDIN: 'in',
  INSTAGRAM: '📷',
  FACEBOOK: 'f',
};

const statusBadges: {
  [key in 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED']: string;
} = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
};

export default function SocialPostCard({
  post,
  showMetrics = false,
}: SocialPostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                platformColors[post.platform]
              }`}
            >
              {platformIcons[post.platform]} {post.platform}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                statusBadges[post.status]
              }`}
            >
              {post.status}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
          <p className="text-gray-700 mb-3 text-base leading-relaxed">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden max-h-64 bg-gray-100">
              <img
                src={post.imageUrl}
                alt="Post"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold">Autor:</span> {post.createdBy.name}
            </div>
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

      {showMetrics && post.metrics && (
        <div className="border-t pt-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {post.metrics.impressions || 0}
            </div>
            <div className="text-xs text-gray-600">Impresiones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {post.metrics.likes || 0}
            </div>
            <div className="text-xs text-gray-600">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {post.metrics.comments || 0}
            </div>
            <div className="text-xs text-gray-600">Comentarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {post.metrics.shares || 0}
            </div>
            <div className="text-xs text-gray-600">Compartidos</div>
          </div>
        </div>
      )}
    </div>
  );
}
