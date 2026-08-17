"use client";

import Link from "next/link";

import { useDemoMode } from "@/src/lib/use-profile";

export function DemoWorkspaceBanner(): JSX.Element | null {
  const isDemo = useDemoMode();

  if (!isDemo) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-kira-brown/25 bg-kira-warmgray/20 px-4 py-3 text-sm text-kira-darkgray">
      <p>
        <span className="font-semibold text-kira-black">Portfolio demo.</span> You are using
        isolated sample data; changes stay in this workspace.
      </p>
      <Link
        className="kira-focus-ring rounded-md px-2 py-1 font-semibold text-kira-brown hover:bg-kira-brown/10"
        href="/demo"
      >
        Start fresh demo
      </Link>
    </div>
  );
}
