"use client";

import type { FocusEvent } from "react";
import { useRef, useState } from "react";

import { Card } from "@/src/components/ui/card";

interface SmartCatalogModuleCardProps {
  animationSrc: string;
  detail: string;
  index: number;
  title: string;
}

export function SmartCatalogModuleCard({
  animationSrc,
  detail,
  index,
  title,
}: SmartCatalogModuleCardProps): JSX.Element {
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
        aria-label="Smart Catalog module with infographic preview"
        className="animate-enter h-full rounded-[28px] border-kira-warmgray/35 p-6 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Module {index + 1}</p>
        <h2 className="mt-3 text-2xl leading-tight text-kira-black">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-kira-darkgray">{detail}</p>

        <div
          className={`mt-5 overflow-hidden rounded-[24px] border border-kira-warmgray/35 bg-[#fbf7f0] transition-all duration-300 ease-out ${
            isPreviewOpen ? "max-h-[24rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3">
            <div className="h-72 overflow-hidden rounded-[1.15rem] border border-kira-warmgray/35 bg-kira-brown">
              <iframe
                aria-label="Animated Smart Catalog workflow preview"
                className="kira-infographic-embed"
                key={previewRun}
                loading="lazy"
                src={`${animationSrc}?preview=${previewRun}`}
                title="Animated Smart Catalog workflow preview"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
