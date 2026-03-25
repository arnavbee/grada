import type { ReactNode } from "react";

import { Card } from "@/src/components/ui/card";

interface DocumentCardProps {
  title: string;
  description: string;
  status: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function DocumentCard({
  title,
  description,
  status,
  actions,
  children,
}: DocumentCardProps): JSX.Element {
  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">Document</p>
          <h2 className="mt-2 text-xl font-semibold text-kira-black dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-kira-darkgray dark:text-gray-300">{description}</p>
        </div>
        <span className="rounded-full bg-kira-warmgray/28 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-kira-darkgray dark:bg-white/10 dark:text-gray-300">
          {status}
        </span>
      </div>
      {children ? <div className="space-y-4">{children}</div> : null}
      {actions ? <div className="mt-auto flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}
