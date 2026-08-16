"use client";

import { useEffect } from "react";

import { Button } from "@/src/components/ui/button";

interface PdfPreviewDialogProps {
  fileUrl: string | null;
  onClose: () => void;
  title: string;
}

export function PdfPreviewDialog({
  fileUrl,
  onClose,
  title,
}: PdfPreviewDialogProps): JSX.Element | null {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!fileUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kira-black/55 p-4 motion-safe:animate-[modal-open_200ms_ease-out]">
      <div
        aria-describedby="pdf-preview-description"
        aria-labelledby="pdf-preview-title"
        aria-modal="true"
        className="flex h-[min(90vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:border dark:border-white/10 dark:bg-[#12141B]"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-kira-warmgray/20 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h2
              className="truncate text-lg font-semibold text-kira-black dark:text-white"
              id="pdf-preview-title"
            >
              {title}
            </h2>
            <p
              className="text-sm text-kira-midgray dark:text-gray-400"
              id="pdf-preview-description"
            >
              Review the generated PDF before downloading it.
            </p>
          </div>
          <Button className="min-h-10 shrink-0" onClick={onClose} variant="secondary">
            Close preview
          </Button>
        </div>
        <iframe
          className="min-h-0 flex-1 bg-kira-offwhite dark:bg-kira-black"
          src={fileUrl}
          title={`${title} PDF preview`}
        />
      </div>
    </div>
  );
}
