import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kira-midgray">404</p>
        <h1 className="mt-3 font-serif text-3xl text-kira-black">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            className="kira-focus-ring rounded-lg bg-kira-brown px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-kira-brown/90"
            href="/"
          >
            Go home
          </Link>
          <Link
            className="kira-focus-ring rounded-lg border border-kira-warmgray/50 px-4 py-2 text-sm font-semibold text-kira-darkgray transition-colors hover:bg-kira-warmgray/20"
            href="/dashboard"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
