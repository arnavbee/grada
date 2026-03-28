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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRun, setPreviewRun] = useState(0);

  const openPreview = (): void => {
    setIsPreviewOpen((current) => {
      if (current) {
        return current;
      }

      setPreviewRun((value) => value + 1);
      return true;
    });
  };

  const closePreview = (): void => {
    setIsPreviewOpen(false);
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
      className="group relative z-0 h-full overflow-visible hover:z-40 focus-within:z-40"
      onBlurCapture={handleBlurCapture}
      onFocusCapture={openPreview}
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      ref={containerRef}
    >
      <Card
        aria-label="Smart Catalog module with infographic preview"
        className="animate-enter h-full p-5 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Module {index + 1}</p>
        <h2 className="mt-2 text-2xl">{title}</h2>
        <p className="mt-2 text-kira-darkgray">{detail}</p>
      </Card>

      <div
        className={`mt-5 overflow-hidden rounded-2xl border border-kira-warmgray/35 bg-[#fbf7f0] transition-all duration-500 ease-out md:max-h-0 md:opacity-0 lg:fixed lg:left-1/2 lg:top-[56%] lg:z-50 lg:mt-0 lg:w-[30rem] lg:max-h-none lg:-translate-x-1/2 lg:-translate-y-1/2 lg:scale-[0.98] lg:shadow-2xl lg:transition-[opacity,transform] lg:duration-300 lg:ease-out ${
          isPreviewOpen
            ? "md:max-h-[46rem] md:opacity-100 lg:pointer-events-none lg:scale-100 lg:opacity-100"
            : "lg:pointer-events-none"
        }`}
      >
        <div className="p-3 md:p-4">
          <div className="overflow-hidden rounded-[1.35rem] border border-kira-warmgray/35 bg-kira-brown/10">
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
    </div>
  );
}
