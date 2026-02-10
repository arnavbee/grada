import type { HTMLAttributes } from "react";

import { cn } from "@/src/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn("surface-card", className)} {...props} />;
}
