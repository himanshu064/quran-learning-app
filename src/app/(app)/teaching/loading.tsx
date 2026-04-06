import { Skeleton } from "@/components/ui/skeleton";

export default function TeachingLoading() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-72 w-full max-w-md rounded-xl" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
