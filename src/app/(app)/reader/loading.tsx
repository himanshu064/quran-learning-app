import { Skeleton } from "@/components/ui/skeleton";

export default function ReaderLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
  );
}
