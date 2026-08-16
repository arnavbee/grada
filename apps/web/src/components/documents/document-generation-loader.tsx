interface DocumentGenerationLoaderProps {
  label: string;
}

export function DocumentGenerationLoader({ label }: DocumentGenerationLoaderProps): JSX.Element {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-[24px] border border-kira-brown/25 bg-kira-warmgray/15 px-5 py-4 dark:border-kira-brown/35 dark:bg-white/5"
      role="status"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-kira-brown/15 text-kira-brown">
          <span className="motion-safe:animate-spin h-5 w-5 rounded-full border-2 border-current border-t-transparent" />
          <span className="absolute h-2 w-2 rounded-full bg-kira-brown" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-kira-black dark:text-white">{label}</p>
          <p className="mt-0.5 text-sm text-kira-darkgray dark:text-gray-300">
            Preparing the final PDF. You can keep reviewing this page while we finish.
          </p>
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-kira-warmgray/35 dark:bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-kira-brown motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
