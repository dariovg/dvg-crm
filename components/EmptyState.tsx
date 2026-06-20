import Link from "next/link";
import NavIcon from "@/components/NavIcon";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = "leads",
  title,
  description,
  actionLabel,
  actionHref,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state-card${className ? ` ${className}` : ""}`}>
      <div className="empty-state-icon-wrap" aria-hidden>
        <NavIcon name={icon} size={26} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
      {!action && actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary empty-state-action">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
