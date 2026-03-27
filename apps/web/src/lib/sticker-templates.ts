import { apiRequest } from "@/src/lib/api-client";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import { getResolvedApiBaseUrl, getResolvedApiOriginUrl } from "@/src/lib/api-url";

export type StickerTemplateKind = "styli" | "custom";
export type StickerElementType = "text_static" | "text_dynamic" | "barcode" | "image" | "line";

export interface StickerElement {
  id: string;
  template_id: string;
  element_type: StickerElementType;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  z_index: number;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StickerTemplate {
  id: string;
  company_id: string;
  name: string;
  width_mm: number;
  height_mm: number;
  border_color: string | null;
  border_radius_mm: number;
  background_color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  elements: StickerElement[];
}

export interface StickerTemplateInput {
  name: string;
  width_mm: number;
  height_mm: number;
  border_color: string | null;
  border_radius_mm: number;
  background_color: string;
  is_default: boolean;
  elements: Array<{
    element_type: StickerElementType;
    x_mm: number;
    y_mm: number;
    width_mm: number;
    height_mm: number;
    z_index: number;
    properties: Record<string, unknown>;
  }>;
}

interface StickerTemplateListResponse {
  items: StickerTemplate[];
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const matches = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(prefix));
  if (matches.length === 0) {
    return null;
  }
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const entry = matches[idx];
    if (!entry) continue;
    const rawValue = entry.slice(prefix.length);
    if (!rawValue) continue;
    try {
      const decoded = decodeURIComponent(rawValue).trim();
      if (decoded) return decoded;
    } catch {
      continue;
    }
  }
  return null;
}

export async function listStickerTemplates(): Promise<StickerTemplate[]> {
  const response = await apiRequest<StickerTemplateListResponse>("/sticker-templates");
  return response.items;
}

export async function getStickerTemplate(templateId: string): Promise<StickerTemplate> {
  return apiRequest<StickerTemplate>(`/sticker-templates/${templateId}`);
}

export async function createStickerTemplate(
  payload: StickerTemplateInput,
): Promise<StickerTemplate> {
  return apiRequest<StickerTemplate>("/sticker-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStickerTemplate(
  templateId: string,
  payload: Partial<StickerTemplateInput>,
): Promise<StickerTemplate> {
  return apiRequest<StickerTemplate>(`/sticker-templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStickerTemplate(templateId: string): Promise<void> {
  await apiRequest<void>(`/sticker-templates/${templateId}`, {
    method: "DELETE",
  });
}

export async function reorderStickerTemplateElements(
  templateId: string,
  elementIds: string[],
): Promise<StickerTemplate> {
  return apiRequest<StickerTemplate>(`/sticker-templates/${templateId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ element_ids: elementIds }),
  });
}

export async function uploadStickerImage(file: File): Promise<{ url: string; filename: string }> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<{ url: string; filename: string }>("/uploads", {
    method: "POST",
    body,
  });
}

export async function previewStickerTemplatePdf(templateId: string): Promise<Blob> {
  const accessToken = getCookieValue("kira_access_token");
  const response = await fetch(
    `${getResolvedApiBaseUrl()}/sticker-templates/${templateId}/preview`,
    {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to generate sticker preview.");
  }
  return response.blob();
}

export function resolveStickerAssetUrl(url: string | null | undefined): string | null {
  return resolveAssetUrl(url) ?? (url ? `${getResolvedApiOriginUrl()}${url}` : null);
}
