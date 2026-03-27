"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { POUploadZone } from "@/src/components/received-po/POUploadZone";
import { Card } from "@/src/components/ui/card";
import { getReceivedPO, uploadReceivedPO } from "@/src/lib/received-po";

export function ReceivedPOUploadView(): JSX.Element {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receivedPoId, setReceivedPoId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Upload a marketplace PO to start parsing.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receivedPoId) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const detail = await getReceivedPO(receivedPoId);
        if (detail.status === "parsed" || detail.status === "confirmed") {
          window.clearInterval(interval);
          router.push(`/dashboard/received-pos/${receivedPoId}`);
          return;
        }
        if (detail.status === "failed") {
          window.clearInterval(interval);
          setBusy(false);
          setError("Parsing failed for this PO. Please upload again or review the source file.");
          return;
        }
        setStatusText("AI is reading your PO...");
      } catch (pollError) {
        window.clearInterval(interval);
        setBusy(false);
        setError(pollError instanceof Error ? pollError.message : "Failed to poll PO status.");
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [receivedPoId, router]);

  const handleUpload = async (file: File): Promise<void> => {
    try {
      setSelectedFile(file);
      setBusy(true);
      setError(null);
      setStatusText("Uploading received PO...");
      const response = await uploadReceivedPO(file);
      setReceivedPoId(response.received_po_id);
      setStatusText("AI is reading your PO...");
    } catch (uploadError) {
      setBusy(false);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
  };

  return (
    <DashboardShell
      subtitle="Upload the official marketplace purchase order to begin barcode, invoice, and packing generation."
      title="Upload Received PO"
    >
      <div className="space-y-6">
        <POUploadZone
          disabled={busy}
          fileName={selectedFile?.name}
          helperText="Upload the official PDF or Excel purchase order you received back from the marketplace."
          onSelectFile={handleUpload}
        />

        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-kira-midgray">Processing status</p>
          <h2 className="mt-2 text-xl font-semibold text-kira-black">{statusText}</h2>
          {busy ? (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-kira-warmgray/25">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-kira-brown" />
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-kira-warmgray">{error}</p> : null}
        </Card>
      </div>
    </DashboardShell>
  );
}
