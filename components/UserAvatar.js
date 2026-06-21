"use client";

import { presenceLabel } from "@/lib/user-presence";

export function userInitials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  name,
  email,
  image,
  profileStatus,
  size = 32,
  showStatus = false,
  locale = "es",
  className = "",
}) {
  const px = typeof size === "number" ? `${size}px` : size;
  const statusColor =
    profileStatus && showStatus
      ? `var(--presence-${profileStatus.toLowerCase()}, #22c55e)`
      : undefined;

  return (
    <span
      className={`user-avatar${showStatus ? " user-avatar--status" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: px, height: px, fontSize: `calc(${px} * 0.38)` }}
      title={showStatus && profileStatus ? presenceLabel(profileStatus, locale) : undefined}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="user-avatar-img" />
      ) : (
        <span className="user-avatar-initials" aria-hidden>
          {userInitials(name, email)}
        </span>
      )}
      {showStatus && profileStatus && profileStatus !== "AVAILABLE" && (
        <span
          className="user-avatar-status-dot"
          style={{ background: statusColor }}
          aria-hidden
        />
      )}
    </span>
  );
}
