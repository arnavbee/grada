"use client";

import type { FocusEvent } from "react";
import { useRef, useState } from "react";

import { Card } from "@/src/components/ui/card";

interface MarketplaceExportsModuleCardProps {
  animationSrc: string;
  detail: string;
  index: number;
  title: string;
}

export function MarketplaceExportsModuleCard({
  animationSrc,
  detail,
  index,
  title,
}: MarketplaceExportsModuleCardProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRun, setPreviewRun] = useState(0);

  const clearCloseTimeout = (): void => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openPreview = (): void => {
    clearCloseTimeout();
    setIsPreviewOpen((current) => {
      if (current) {
        return current;
      }

      setPreviewRun((value) => value + 1);
      return true;
    });
  };

  const closePreview = (): void => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setIsPreviewOpen(false);
      closeTimeoutRef.current = null;
    }, 140);
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>): void => {
    const nextFocusTarget = event.relatedTarget as Node | null;

    if (nextFocusTarget && containerRef.current?.contains(nextFocusTarget)) {
      return;
    }

    closePreview();
  };

  return (
    <div
      className="group h-full"
      onBlurCapture={handleBlurCapture}
      onFocusCapture={openPreview}
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      ref={containerRef}
    >
      <Card
        aria-label="Marketplace Exports module with infographic preview"
        className="animate-enter kira-tint-sage relative h-full min-h-[22rem] overflow-hidden rounded-[28px] border-kira-warmgray/35 p-6 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
        tabIndex={0}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-kira-brown/14 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-[#8E9B87]/18" />
          <div className="absolute left-6 bottom-4 h-32 w-32 rounded-full bg-kira-brown/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
        </div>
        <div
          className={`relative z-10 transition-opacity duration-200 ${isPreviewOpen ? "opacity-0" : "opacity-100"}`}
        >
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
            Module {index + 1}
          </p>
          <h2 className="mt-3 text-2xl leading-tight text-kira-black">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-kira-darkgray">{detail}</p>
        </div>

        {isPreviewOpen ? (
          <div aria-hidden="false" className="pointer-events-none absolute inset-0 bg-kira-brown">
            <div className="h-full overflow-hidden">
              <iframe
                aria-label="Animated Marketplace Exports workflow preview"
                className="kira-infographic-embed"
                key={previewRun}
                loading="lazy"
                src={`${animationSrc}?preview=${previewRun}`}
                title="Animated Marketplace Exports workflow preview"
              />
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
