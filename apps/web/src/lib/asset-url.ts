import { getResolvedApiOriginUrl } from "@/src/lib/api-url";

function normalizeStaticAssetPath(rawPath: string): string {
  let normalized = rawPath.trim();
  if (!normalized) {
    return normalized;
  }

  if (normalized.startsWith("/api/v1/static/")) {
    normalized = normalized.replace(/^\/api\/v1/, "");
  } else if (normalized.startsWith("api/v1/static/")) {
    normalized = `/${normalized.replace(/^api\/v1/, "")}`;
  } else if (normalized.startsWith("/api/v1/uploads/")) {
    normalized = normalized.replace(/^\/api\/v1\/uploads\//, "/static/uploads/");
  } else if (normalized.startsWith("api/v1/uploads/")) {
    normalized = `/static/uploads/${normalized.replace(/^api\/v1\/uploads\//, "")}`;
  } else if (normalized.startsWith("/uploads/")) {
    normalized = `/static${normalized}`;
  } else if (normalized.startsWith("uploads/")) {
    normalized = `/static/${normalized}`;
  } else if (normalized.startsWith("static/")) {
    normalized = `/${normalized}`;
  }

  if (!normalized.startsWith("/")) {
    return normalized;
  }
  return normalized.replace(/\/{2,}/g, "/");
}

export function resolveAssetUrl(assetUrl: string | null | undefined): string | null {
  if (!assetUrl) {
    return null;
  }

  const raw = String(assetUrl).trim();
  if (!raw) {
    return null;
  }

  const apiOrigin = getResolvedApiOriginUrl();
  const hasAbsoluteApiOrigin = apiOrigin.startsWith("http://") || apiOrigin.startsWith("https://");
  const normalizedApiOrigin = apiOrigin.replace(/\/+$/, "");

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      const isApiOriginUrl =
        hasAbsoluteApiOrigin &&
        parsed.origin.toLowerCase() === new URL(normalizedApiOrigin).origin.toLowerCase();
      const isLegacyApiUploadPath =
        parsed.pathname.startsWith("/api/v1/static/") ||
        parsed.pathname.startsWith("/api/v1/uploads/") ||
        parsed.pathname.startsWith("/uploads/") ||
        parsed.pathname.startsWith("/static/");
      if (!isApiOriginUrl && !isLegacyApiUploadPath) {
        return raw;
      }
      const normalizedPath = normalizeStaticAssetPath(parsed.pathname);
      if (isApiOriginUrl && normalizedPath.startsWith("/static/")) {
        return `${normalizedApiOrigin}${normalizedPath}${parsed.search}${parsed.hash}`;
      }
      if (normalizedPath !== parsed.pathname) {
        return `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  const normalizedPath = normalizeStaticAssetPath(raw);
  if (normalizedPath.startsWith("/static/") && hasAbsoluteApiOrigin) {
    return `${normalizedApiOrigin}${normalizedPath}`;
  }
  return normalizedPath;
}
