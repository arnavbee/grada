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
      className="group h-full"
      onBlurCapture={handleBlurCapture}
      onFocusCapture={openPreview}
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      ref={containerRef}
    >
      <Card
        aria-label="Received PO Processing module with infographic preview"
        className="animate-enter relative h-full min-h-[22rem] overflow-hidden rounded-[28px] border-kira-warmgray/35 p-6 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
        tabIndex={0}
      >
        <div
          className={`transition-opacity duration-200 ${isPreviewOpen ? "opacity-0" : "opacity-100"}`}
        >
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
            Module {index + 1}
          </p>
          <h2 className="mt-3 text-2xl leading-tight text-kira-black">{title}</h2>
          <p className="mt-2 text-kira-darkgray">
            Upload marketplace POs in PDF, XLS, or XLSX, review parsed rows, and confirm one clean
            source of truth before ops moves downstream.
          </p>
        </div>

        <div
          aria-hidden={!isPreviewOpen}
          className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
            isPreviewOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-full overflow-hidden rounded-[28px] bg-kira-brown">
            <iframe
              aria-label="Animated received PO processing workflow preview"
              className="kira-infographic-embed"
              key={previewRun}
              loading="lazy"
              scrolling="no"
              src={`${animationSrc}?preview=${previewRun}`}
              tabIndex={-1}
              title="Animated received PO processing workflow preview"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
