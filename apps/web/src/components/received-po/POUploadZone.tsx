"use client";

import { DragEvent, useRef } from "react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";

interface POUploadZoneProps {
  disabled?: boolean;
  fileName?: string | null;
  helperText?: string;
  onSelectFile: (file: File) => void;
}

const ACCEPTED_TYPES = ".pdf,.xlsx,.xls";

export function POUploadZone({
  disabled = false,
  fileName,
  helperText = "Accepts PDF, XLSX, and XLS marketplace PO files.",
  onSelectFile,
}: POUploadZoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      onSelectFile(nextFile);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-kira-midgray/45 bg-kira-offwhite/60 p-8 text-center",
        disabled ? "opacity-70" : "hover:border-kira-brown/60",
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        accept={ACCEPTED_TYPES}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) {
            onSelectFile(nextFile);
          }
        }}
        ref={inputRef}
        type="file"
      />
      <p className="text-sm uppercase tracking-[0.18em] text-kira-midgray">Received PO Upload</p>
      <h2 className="mt-3 text-2xl font-semibold text-kira-black">Drop the marketplace PO here</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-kira-darkgray">{helperText}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button disabled={disabled} onClick={() => inputRef.current?.click()} type="button">
          Select file
        </Button>
        {fileName ? <span className="text-sm text-kira-darkgray">{fileName}</span> : null}
      </div>
    </div>
  );
}
