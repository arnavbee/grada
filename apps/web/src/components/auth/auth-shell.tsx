import type { ReactNode } from "react";

import { Card } from "@/src/components/ui/card";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps): JSX.Element {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1280px] grid-cols-1 gap-6 p-4 md:grid-cols-12 md:p-8">
      <section className="surface-card animate-enter relative overflow-hidden p-6 md:col-span-5 md:p-8">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-kira-brown/10" />
        <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">grada</p>
        <h1 className="mt-2">{title}</h1>
        <p className="mt-2 text-kira-darkgray">{subtitle}</p>
        <div className="mt-8 space-y-3">
          <div className="rounded-lg border border-kira-warmgray/40 bg-kira-offwhite p-3">
            <p className="text-sm font-semibold">Security-first</p>
            <small className="text-kira-midgray">Session timeout, role access, and audit-aware workflows.</small>
          </div>
          <div className="rounded-lg border border-kira-warmgray/40 bg-kira-offwhite p-3">
            <p className="text-sm font-semibold">Built for operations teams</p>
            <small className="text-kira-midgray">Fast forms, dense data readability, and keyboard-friendly controls.</small>
          </div>
        </div>
      </section>

      <Card className="animate-enter p-5 md:col-span-7 md:p-8" style={{ animationDelay: "100ms" }}>
        {children}
      </Card>
    </main>
  );
}
