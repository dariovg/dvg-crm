interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonPageHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <header className="page-head skeleton-page-head">
      <div className="skeleton-page-head-text">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-subtitle" />
      </div>
      {withAction && <Skeleton className="skeleton-action" />}
    </header>
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`skeleton-kpi-grid skeleton-kpi-grid--${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-kpi">
          <Skeleton className="skeleton-kpi-value" />
          <Skeleton className="skeleton-kpi-label" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3, tall = false }: { lines?: number; tall?: boolean }) {
  return (
    <div className={`skeleton-card${tall ? " skeleton-card--tall" : ""}`}>
      <Skeleton className="skeleton-card-title" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`skeleton-line${i === lines - 1 ? " skeleton-line--short" : ""}`}
        />
      ))}
    </div>
  );
}

export function SkeletonPostList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-post-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-panel">
          <Skeleton className="skeleton-line skeleton-line--badge" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line skeleton-line--medium" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table-wrap">
      <div className="skeleton-table-head">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-th" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="skeleton-table-row">
          {Array.from({ length: 5 }).map((_, col) => (
            <Skeleton key={col} className="skeleton-td" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <SkeletonPageHeader withAction />
      <SkeletonKpiGrid count={6} />
      <SkeletonCard lines={2} />
      <div className="skeleton-dash-grid">
        <SkeletonCard lines={5} tall />
        <SkeletonCard lines={4} tall />
      </div>
    </>
  );
}

export function MarketingPostsSkeleton() {
  return (
    <div className="page-pad">
      <SkeletonPageHeader withAction />
      <SkeletonPostList count={3} />
    </div>
  );
}

export function MarketingPublishedSkeleton() {
  return (
    <div className="page-pad">
      <SkeletonPageHeader />
      <div className="skeleton-filter-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-chip" />
        ))}
      </div>
      <div className="skeleton-card-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-post-card" />
        ))}
      </div>
    </div>
  );
}

export function ConexionesSkeleton() {
  return (
    <div className="page-pad">
      <SkeletonPageHeader />
      <div className="skeleton-panels-row">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}

export function WeekViewSkeleton() {
  return (
    <div className="page-pad">
      <SkeletonPageHeader />
      <SkeletonKpiGrid count={3} />
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <>
      <SkeletonPageHeader withAction />
      <div className="skeleton-filters">
        <Skeleton className="skeleton-filter-input" />
        <Skeleton className="skeleton-filter-select" />
        <Skeleton className="skeleton-filter-select" />
      </div>
      <SkeletonTable rows={8} />
    </>
  );
}
