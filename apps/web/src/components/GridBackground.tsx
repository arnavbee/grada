export function GridBackground(): JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: [
            "linear-gradient(to right, var(--kira-grid-line) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--kira-grid-line) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "2.5% 100%, 100% 2.5%",
        }}
      />
      <div className="absolute left-[18%] top-[22%] h-3 w-3 bg-kira-brown/35" />
      <div className="absolute left-[62%] top-[36%] h-3 w-3 bg-kira-brown/22 dark:bg-[#A6B09B]/28" />
      <div className="absolute left-[78%] top-[70%] h-3 w-3 bg-kira-brown/28" />
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, var(--kira-grid-fade) 100%)",
        }}
      />
    </div>
  );
}
