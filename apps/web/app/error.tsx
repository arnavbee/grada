"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kira-midgray">
          Something went wrong
        </p>
        <h1 className="mt-3 font-serif text-3xl text-kira-black">An unexpected error occurred</h1>
        <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
          Try again in a moment. If the problem continues, the server may be restarting.
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
            href="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
