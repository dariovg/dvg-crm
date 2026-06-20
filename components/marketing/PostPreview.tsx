import { SocialPlatform } from "@prisma/client";

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "X",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
};

interface PostPreviewProps {
  platform: SocialPlatform | string;
  content: string;
  imageUrl?: string;
}

export default function PostPreview({
  platform,
  content,
  imageUrl = "",
}: PostPreviewProps) {
  const label = PLATFORM_LABELS[platform] || platform;
  const placeholder = `Escribe el post para ver la vista previa en ${label}…`;

  return (
    <div className="post-preview">
      <div className="post-preview-label">Vista previa · {label}</div>
      <div className={`post-preview-card post-preview-card--${platform.toLowerCase()}`}>
        <div className="post-preview-head">
          <div className="post-preview-avatar" aria-hidden>
            DVG
          </div>
          <div>
            <strong className="post-preview-name">DVG Studio</strong>
            <span className="post-preview-handle">@dvgsstudio</span>
          </div>
        </div>
        <div className="post-preview-body">
          {content.trim() ? (
            content.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < content.split("\n").length - 1 && <br />}
              </span>
            ))
          ) : (
            <span className="post-preview-placeholder">{placeholder}</span>
          )}
        </div>
        {imageUrl.trim() && (
          <div className="post-preview-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl.trim()} alt="" />
          </div>
        )}
      </div>
    </div>
  );
}
