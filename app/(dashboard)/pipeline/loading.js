import { SkeletonPageHeader, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="skeleton-pipeline">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={4} tall />
        ))}
      </div>
    </>
  );
}
