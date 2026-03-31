"use client";

import { useState } from "react";

import { SectionEyebrow } from "@/src/components/marketing/section-eyebrow";
import { cn } from "@/src/lib/cn";

type WorkflowView = {
  bulletTone: string;
  bullets: string[];
  carryDetail: string;
  carryTitle: string;
  carryTone: string;
  detail: string;
  eyebrow: string;
  label: string;
  panelTone: string;
  title: string;
  value: string;
};

export function WorkflowTabs({ views }: { views: WorkflowView[] }): JSX.Element {
  const [activeView, setActiveView] = useState(views[0]?.value ?? "");
  const currentView = views.find((view) => view.value === activeView) ?? views[0];

  if (!currentView) {
    return <></>;
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap justify-start gap-2">
        {views.map((view) => {
          const isActive = view.value === currentView.value;

          return (
            <button
              className={cn(
                "min-w-[10rem] justify-start rounded-full border border-kira-warmgray/40 bg-white/55 px-5 py-3 text-left text-sm dark:border-white/10 dark:bg-white/6 dark:text-kira-midgray",
                isActive
                  ? "border-kira-brown/15 bg-[linear-gradient(135deg,rgba(160,111,66,0.96),rgba(22,33,29,0.92))] text-kira-offwhite dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(209,164,111,0.92),rgba(41,54,48,0.96))] dark:text-kira-offwhite"
                  : "text-kira-darkgray hover:border-kira-brown/25 hover:text-kira-black",
              )}
              key={view.value}
              onClick={() => setActiveView(view.value)}
              type="button"
            >
              {view.label}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-6 rounded-[28px] border border-kira-warmgray/35 p-6 md:p-7 dark:border-white/10",
          currentView.panelTone,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
              {currentView.eyebrow}
            </p>
            <h3 className="mt-3 text-[2rem] leading-tight text-kira-black md:text-[2.6rem]">
              {currentView.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-kira-darkgray">{currentView.detail}</p>
          </div>
          <div
            className={cn(
              "w-full rounded-[24px] border border-kira-warmgray/35 p-5 dark:border-white/10 lg:max-w-sm",
              currentView.carryTone,
            )}
          >
            <SectionEyebrow linePosition="after">{currentView.label}</SectionEyebrow>
            <h4 className="mt-4 text-2xl leading-tight">{currentView.carryTitle}</h4>
            <p className="mt-3 text-sm leading-7 text-kira-darkgray">{currentView.carryDetail}</p>
          </div>
        </div>

        <div className="my-5 h-px w-full bg-kira-warmgray/40" />

        <div className="grid gap-3 md:grid-cols-3">
          {currentView.bullets.map((bullet) => (
            <div
              className={cn(
                "flex h-full items-start gap-3 rounded-2xl border border-kira-warmgray/30 px-4 py-4 dark:border-white/10",
                currentView.panelTone,
              )}
              key={bullet}
            >
              <span className={cn("mt-2 h-2 w-2 rounded-full", currentView.bulletTone)} />
              <p className="text-sm leading-6 text-kira-darkgray">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
