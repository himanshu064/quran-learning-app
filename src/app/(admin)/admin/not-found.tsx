import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/admin">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
