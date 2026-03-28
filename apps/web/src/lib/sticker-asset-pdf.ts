import { resolveAssetUrl } from "@/src/lib/asset-url";

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read sticker asset."));
    image.src = source;
  });
}

function sanitizeFilename(filenameHint: string, extension: string): string {
  const cleaned = filenameHint
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
  const base = cleaned.replace(/\.[a-zA-Z0-9]+$/, "") || "sticker-asset";
  return `${base}.${extension}`;
}

async function rasterizeImageBlob(blob: Blob, filenameHint: string): Promise<File> {
  if (typeof window === "undefined") {
    throw new Error("Sticker asset rasterization is only available in the browser.");
  }

  const objectUrl = window.URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    const width = Math.max(1, Math.round(image.naturalWidth || image.width || 512));
    const height = Math.max(1, Math.round(image.naturalHeight || image.height || 512));
    const canvas = window.document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to prepare sticker asset for PDF generation.");
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (!value) {
            reject(new Error("Unable to export sticker asset as PNG."));
            return;
          }
          resolve(value);
        },
        "image/png",
        1,
      );
    });

    return new File([pngBlob], sanitizeFilename(filenameHint, "png"), { type: "image/png" });
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }
}

export function getStickerAssetFetchUrl(assetUrl: string): string {
  const raw = assetUrl.trim();
  const resolved = resolveAssetUrl(raw) ?? raw;

  if (typeof window === "undefined") {
    return resolved;
  }

  try {
    const url = new URL(resolved, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.toString();
    }
    return `${window.location.origin}/api/sticker-assets/proxy?url=${encodeURIComponent(
      url.toString(),
    )}`;
  } catch {
    return resolved;
  }
}

export async function normalizeStickerAssetFileForPdf(file: File): Promise<File> {
  if (typeof window === "undefined") {
    return file;
  }

  const normalizedType = file.type.toLowerCase();
  if (!normalizedType.startsWith("image/")) {
    return file;
  }
  if (normalizedType === "image/png" || normalizedType === "image/jpeg") {
    return file;
  }
  return rasterizeImageBlob(file, file.name || "sticker-asset");
}

export async function normalizeStickerAssetUrlForPdf(
  assetUrl: string,
  filenameHint: string,
): Promise<File> {
  const response = await fetch(getStickerAssetFetchUrl(assetUrl), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch sticker asset for PDF generation.");
  }

  const blob = await response.blob();
  const normalizedType = blob.type.toLowerCase();
  if (normalizedType === "image/png" || normalizedType === "image/jpeg") {
    const extension = normalizedType === "image/png" ? "png" : "jpg";
    return new File([blob], sanitizeFilename(filenameHint, extension), { type: blob.type });
  }
  return rasterizeImageBlob(blob, filenameHint);
}
