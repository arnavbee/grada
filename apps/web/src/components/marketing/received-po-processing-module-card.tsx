"use client";

import type { FocusEvent } from "react";
import { useRef, useState } from "react";

import { Card } from "@/src/components/ui/card";

interface ReceivedPoProcessingModuleCardProps {
  animationSrc: string;
  index: number;
  title: string;
}

export function ReceivedPoProcessingModuleCard({
  animationSrc,
  index,
  title,
}: ReceivedPoProcessingModuleCardProps): JSX.Element {
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
      className="group relative z-0 h-full overflow-visible hover:z-40 focus-within:z-40"
      onBlurCapture={handleBlurCapture}
      onFocusCapture={openPreview}
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      ref={containerRef}
    >
      <Card
        aria-label="Received PO Processing module with infographic preview"
        className="animate-enter h-full p-5 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Module {index + 1}</p>
        <h2 className="mt-2 text-2xl">{title}</h2>
        <p className="mt-2 text-kira-darkgray">
          Upload marketplace POs in PDF, XLS, or XLSX, review parsed rows, and confirm one clean
          source of truth before ops moves downstream.
        </p>
      </Card>

      <div
        className={`mt-5 overflow-hidden rounded-2xl border border-kira-warmgray/35 bg-[#fbf7f0] transition-all duration-500 ease-out md:max-h-0 md:opacity-0 lg:absolute lg:right-[calc(100%+1rem)] lg:top-1/2 lg:z-50 lg:mt-0 lg:w-[30rem] lg:max-h-none lg:-translate-y-1/2 lg:-translate-x-2 lg:scale-[0.98] lg:shadow-2xl lg:transition-[opacity,transform] lg:duration-300 lg:ease-out ${
          isPreviewOpen
            ? "md:max-h-[46rem] md:opacity-100 lg:pointer-events-auto lg:translate-x-0 lg:scale-100 lg:opacity-100"
            : "lg:pointer-events-none"
        }`}
        onMouseEnter={openPreview}
        onMouseLeave={closePreview}
      >
        <div className="p-3 md:p-4">
          <div className="overflow-hidden rounded-[1.35rem] border border-kira-warmgray/35 bg-kira-brown">
            <iframe
              aria-label="Animated received PO processing workflow preview"
              className="kira-infographic-embed"
              key={previewRun}
              loading="lazy"
              src={`${animationSrc}?preview=${previewRun}`}
              title="Animated received PO processing workflow preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
