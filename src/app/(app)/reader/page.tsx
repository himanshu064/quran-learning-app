import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReaderScreen } from "./reader-screen";

export const metadata: Metadata = { title: "Reader" };

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <ReaderScreen />
    </Suspense>
  );
}
