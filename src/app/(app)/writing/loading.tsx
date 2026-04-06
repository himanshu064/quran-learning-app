import { Skeleton } from "@/components/ui/skeleton";

export default function WritingLoading() {
  return (
    <div className="flex flex-col items-center gap-5 p-6">
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-12 w-32 rounded-full" />
      <Skeleton className="h-20 w-full max-w-md rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
