import { SkeletonCard } from "@/components/Skeleton";

export default function DashboardExtraSkeleton() {
  return (
    <>
      <SkeletonCard lines={4} tall />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </>
  );
}
