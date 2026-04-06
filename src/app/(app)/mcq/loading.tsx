import { Skeleton } from "@/components/ui/skeleton";

export default function McqLoading() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-12 w-32 rounded-full" />
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
