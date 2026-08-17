export default function DashboardLoading(): JSX.Element {
  return (
    <div className="mx-auto grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:gap-6 md:p-6">
      <aside className="surface-card hidden md:col-span-3 md:block lg:col-span-2">
        <div className="border-b border-kira-warmgray/35 px-4 py-5">
          <div className="h-5 w-28 animate-pulse rounded-md bg-kira-warmgray/30" />
          <div className="mt-2 h-3 w-36 animate-pulse rounded-md bg-kira-warmgray/20" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              className="h-8 animate-pulse rounded-md bg-kira-warmgray/15"
              key={index}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))}
        </div>
      </aside>
      <main className="space-y-6 md:col-span-9 lg:col-span-10">
        <div className="surface-card rounded-2xl p-6">
          <div className="h-7 w-52 animate-pulse rounded-md bg-kira-warmgray/30" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-md bg-kira-warmgray/20" />
        </div>
        <div className="surface-card rounded-2xl p-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                className="h-10 animate-pulse rounded-md bg-kira-warmgray/15"
                key={index}
                style={{ animationDelay: `${index * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
