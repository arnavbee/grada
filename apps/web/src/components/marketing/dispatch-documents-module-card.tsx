"use client";

import type { FocusEvent } from "react";
import { useRef, useState } from "react";

import { Card } from "@/src/components/ui/card";

interface DispatchDocumentsModuleCardProps {
  barcodeAnimationSrc: string;
  invoiceAnimationSrc: string;
  index: number;
  title: string;
}

export function DispatchDocumentsModuleCard({
  barcodeAnimationSrc,
  invoiceAnimationSrc,
  index,
  title,
}: DispatchDocumentsModuleCardProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewKind, setPreviewKind] = useState<"barcode" | "invoice">("barcode");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRun, setPreviewRun] = useState(0);

  const clearCloseTimeout = (): void => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openPreview = (kind: "barcode" | "invoice"): void => {
    clearCloseTimeout();
    setPreviewKind((current) => (current === kind ? current : kind));
    setIsPreviewOpen((current) => {
      if (current && previewKind === kind) {
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
      onFocusCapture={() => openPreview(previewKind)}
      onMouseEnter={() => openPreview(previewKind)}
      onMouseLeave={closePreview}
      ref={containerRef}
    >
      <Card
        className="animate-enter h-full rounded-[28px] border-kira-warmgray/35 p-6 transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${120 + index * 80}ms` }}
      >
        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Module {index + 1}</p>
        <h2 className="mt-3 text-2xl leading-tight text-kira-black">{title}</h2>
        <p className="mt-2 text-kira-darkgray">
          Generate{" "}
          <button
            className="kira-focus-ring rounded-sm bg-kira-brown/12 px-1.5 py-0.5 font-semibold text-kira-black transition-colors hover:bg-kira-brown/20"
            onFocus={() => openPreview("barcode")}
            onMouseEnter={() => openPreview("barcode")}
            type="button"
          >
            barcodes
          </button>
          ,{" "}
          <button
            className="kira-focus-ring rounded-sm bg-kira-brown/12 px-1.5 py-0.5 font-semibold text-kira-black transition-colors hover:bg-kira-brown/20"
            onFocus={() => openPreview("invoice")}
            onMouseEnter={() => openPreview("invoice")}
            type="button"
          >
            GST invoices
          </button>
          , packing lists, and sticker outputs from the same confirmed PO instead of rebuilding each
          document by hand.
        </p>
        <div
          className={`mt-5 overflow-hidden rounded-[24px] border border-kira-warmgray/35 bg-[#fbf7f0] transition-all duration-300 ease-out ${
            isPreviewOpen ? "max-h-[24rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3">
            <div className="h-72 overflow-hidden rounded-[1.15rem] border border-kira-warmgray/35 bg-kira-brown">
              <iframe
                aria-label={
                  previewKind === "invoice"
                    ? "Animated commercial invoice workflow preview"
                    : "Animated barcode generation workflow preview"
                }
                className="kira-infographic-embed"
                key={previewRun}
                loading="lazy"
                src={`${
                  previewKind === "invoice" ? invoiceAnimationSrc : barcodeAnimationSrc
                }?preview=${previewRun}`}
                title={
                  previewKind === "invoice"
                    ? "Animated commercial invoice workflow preview"
                    : "Animated barcode generation workflow preview"
                }
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
