"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          {error.digest
            ? "An unexpected error occurred. This is usually temporary."
            : error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
