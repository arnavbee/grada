"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error("Dashboard error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="surface-card w-full max-w-md rounded-2xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kira-midgray">
          Something went wrong
        </p>
        <h1 className="mt-3 font-serif text-2xl text-kira-black">
          This view hit an unexpected error
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
          Your data is safe. Try again, or head back to the dashboard — if it keeps happening, the
          server may be waking up.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="kira-focus-ring rounded-lg bg-kira-brown px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-kira-brown/90"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="kira-focus-ring rounded-lg border border-kira-warmgray/50 px-4 py-2 text-sm font-semibold text-kira-darkgray transition-colors hover:bg-kira-warmgray/20"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
