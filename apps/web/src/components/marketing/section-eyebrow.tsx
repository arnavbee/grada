import type { ReactNode } from "react";

import { cn } from "@/src/lib/cn";

type SectionEyebrowProps = {
  children: ReactNode;
  className?: string;
  lineClassName?: string;
  linePosition?: "after" | "before" | "none";
};

export function SectionEyebrow({
  children,
  className,
  lineClassName,
  linePosition = "none",
}: SectionEyebrowProps): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {linePosition === "before" ? (
        <span aria-hidden="true" className={cn("h-px w-10 bg-kira-brown/70", lineClassName)} />
      ) : null}
      <p
        className={cn(
          "text-[0.7rem] font-medium uppercase tracking-[0.2em] text-kira-midgray",
          className,
        )}
      >
        {children}
      </p>
      {linePosition === "after" ? (
        <span aria-hidden="true" className={cn("h-px flex-1 bg-kira-warmgray/45", lineClassName)} />
      ) : null}
    </div>
  );
}
