"use client";

import { DndContext, type DragEndEvent, type DragStartEvent, useDraggable } from "@dnd-kit/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  createStickerTemplate,
  deleteStickerTemplate,
  getStickerTemplate,
  listStickerTemplates,
  previewStickerTemplatePdf,
  reorderStickerTemplateElements,
  resolveStickerAssetUrl,
  updateStickerTemplate,
  uploadStickerImage,
  type StickerElement,
  type StickerElementType,
  type StickerTemplate,
} from "@/src/lib/sticker-templates";
import {
  useStickerBuilderStore,
  type StickerTemplateDraft,
} from "@/src/stores/stickerBuilderStore";

const MM_TO_PX = 3.7795;
const DEFAULT_TEMPLATE: StickerTemplateDraft = {
  name: "New sticker template",
  width_mm: 45.03,
  height_mm: 60,
  border_color: "#000000",
  border_radius_mm: 2,
  background_color: "#FFFFFF",
  is_default: false,
};

const SAMPLE_VALUES: Record<string, string> = {
  po_number: "70150792",
  model_number: "IN000090128",
  option_id: "7015079228",
  size: "M",
  styli_sku: "701507922803",
  brand_name: "House Of Raeli",
  sku_id: "HRDS25001-A-BLACK-M",
  color: "Black",
  quantity: "7",
  instagram_handle: "",
  website_url: "",
  facebook_handle: "",
  snapchat_handle: "",
};

const STYLI_STARTER_TEMPLATE: StickerTemplateDraft = {
  name: "Styli starter template",
  width_mm: 45.03,
  height_mm: 60,
  border_color: "#dc5096",
  border_radius_mm: 2,
  background_color: "#FFFFFF",
  is_default: false,
};

const DYNAMIC_FIELDS = [
  { label: "PO number", value: "po_number" },
  { label: "Model number", value: "model_number" },
  { label: "Option ID", value: "option_id" },
  { label: "Size", value: "size" },
  { label: "Styli SKU", value: "styli_sku" },
  { label: "Brand name", value: "brand_name" },
  { label: "SKU ID", value: "sku_id" },
  { label: "Color", value: "color" },
  { label: "Quantity", value: "quantity" },
  { label: "Instagram handle", value: "instagram_handle" },
  { label: "Website", value: "website_url" },
  { label: "Facebook handle", value: "facebook_handle" },
  { label: "Snapchat handle", value: "snapchat_handle" },
  { label: "Custom formula", value: "custom" },
] as const;

const SOCIAL_FIELDS = new Set([
  "instagram_handle",
  "website_url",
  "facebook_handle",
  "snapchat_handle",
]);

const BARCODE_FIELDS = [
  { label: "Option ID", value: "option_id" },
  { label: "Styli SKU", value: "styli_sku" },
  { label: "SKU ID", value: "sku_id" },
  { label: "Model number", value: "model_number" },
  { label: "Custom formula", value: "custom_formula" },
] as const;

const RESIZE_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

type ResizeHandle = (typeof RESIZE_HANDLES)[number];

interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  origin: StickerElement;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sticker-${Math.random().toString(36).slice(2, 10)}`;
}

function roundValue(value: number, snap: boolean): number {
  const rounded = snap ? Math.round(value) : Number(value.toFixed(2));
  return Number(Math.max(0, rounded).toFixed(2));
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildElement(
  type: StickerElementType,
  template: StickerTemplateDraft,
  field = "po_number",
): StickerElement {
  const centerX = Math.max(1, template.width_mm / 2 - 12);
  const centerY = Math.max(1, template.height_mm / 2 - 4);
  const base = {
    id: createId(),
    template_id: template.id ?? "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    x_mm: Number(centerX.toFixed(2)),
    y_mm: Number(centerY.toFixed(2)),
    z_index: 0,
  };

  if (type === "text_static") {
    return {
      ...base,
      element_type: type,
      width_mm: 24,
      height_mm: 6,
      properties: {
        content: "Made in India",
        font_size: 8,
        font_weight: "normal",
        alignment: "center",
        color: "#000000",
      },
    };
  }

  if (type === "text_dynamic") {
    const isSocialField = SOCIAL_FIELDS.has(field);
    return {
      ...base,
      element_type: type,
      width_mm: isSocialField ? 18 : 28,
      height_mm: isSocialField ? 3.4 : 6,
      properties: {
        field,
        label:
          field === "custom" || isSocialField
            ? ""
            : `${field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} : `,
        label_weight: "normal",
        value_weight: "bold",
        font_size: isSocialField ? 6.2 : 10,
        alignment: isSocialField ? "left" : "center",
        color: "#000000",
        custom_formula: field === "custom" ? "styli_sku" : "",
        social_value:
          field === "instagram_handle"
            ? "/instagram_handle"
            : field === "website_url"
              ? "website.com"
              : field === "facebook_handle"
                ? "/facebook_handle"
                : field === "snapchat_handle"
                  ? "/snapchat_handle"
                  : "",
      },
    };
  }

  if (type === "barcode") {
    return {
      ...base,
      element_type: type,
      width_mm: 32,
      height_mm: 16,
      properties: {
        field: "styli_sku",
        custom_formula: "styli_sku",
        barcode_type: "code128",
        show_number: true,
        number_font_size: 7,
      },
    };
  }

  if (type === "image") {
    return {
      ...base,
      element_type: type,
      width_mm: 20,
      height_mm: 10,
      properties: {
        asset_type: "logo",
        asset_url: "",
        fit: "contain",
      },
    };
  }

  return {
    ...base,
    element_type: "line",
    width_mm: 20,
    height_mm: 1,
    properties: {
      orientation: "horizontal",
      color: "#000000",
      thickness_pt: 0.5,
    },
  };
}

function mapTemplateToDraft(template: StickerTemplate): StickerTemplateDraft {
  return {
    id: template.id,
    name: template.name,
    width_mm: template.width_mm,
    height_mm: template.height_mm,
    border_color: template.border_color,
    border_radius_mm: template.border_radius_mm,
    background_color: template.background_color,
    is_default: template.is_default,
  };
}

function createStyliStarterElements(): StickerElement[] {
  const now = new Date().toISOString();
  return [
    {
      id: createId(),
      template_id: "draft",
      element_type: "image",
      x_mm: 8.5,
      y_mm: 3.2,
      width_mm: 28,
      height_mm: 9.8,
      z_index: 0,
      properties: {
        asset_type: "logo",
        asset_url: "",
        fit: "contain",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 4.5,
      y_mm: 16.8,
      width_mm: 36,
      height_mm: 4.8,
      z_index: 1,
      properties: {
        field: "po_number",
        label: "PO No : ",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 10.2,
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 3.1,
      y_mm: 21.1,
      width_mm: 39.2,
      height_mm: 4.4,
      z_index: 2,
      properties: {
        field: "model_number",
        label: "Model No. : ",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 10,
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 3.3,
      y_mm: 25.5,
      width_mm: 38.5,
      height_mm: 4.4,
      z_index: 3,
      properties: {
        field: "option_id",
        label: "Option ID : ",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 10,
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "barcode",
      x_mm: 6,
      y_mm: 31.6,
      width_mm: 33,
      height_mm: 12.6,
      z_index: 4,
      properties: {
        field: "styli_sku",
        custom_formula: "styli_sku",
        barcode_type: "code128",
        show_number: true,
        number_font_size: 8,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 13.2,
      y_mm: 45.6,
      width_mm: 18.5,
      height_mm: 3.4,
      z_index: 5,
      properties: {
        field: "quantity",
        label: "Qty: ",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 7.5,
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 7.2,
      y_mm: 48.8,
      width_mm: 30.5,
      height_mm: 4.2,
      z_index: 6,
      properties: {
        field: "size",
        label: "Size : ",
        label_weight: "bold",
        value_weight: "bold",
        font_size: 12.5,
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_static",
      x_mm: 9.4,
      y_mm: 52.7,
      width_mm: 26,
      height_mm: 2.8,
      z_index: 7,
      properties: {
        content: "Made in India",
        font_size: 8.3,
        font_weight: "normal",
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_static",
      x_mm: 12.5,
      y_mm: 55.1,
      width_mm: 20,
      height_mm: 2.4,
      z_index: 8,
      properties: {
        content: "Follow us",
        font_size: 7,
        font_weight: "normal",
        alignment: "center",
        color: "#000000",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 4.5,
      y_mm: 57,
      width_mm: 17,
      height_mm: 2.6,
      z_index: 9,
      properties: {
        field: "snapchat_handle",
        label: "",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 5.8,
        alignment: "left",
        color: "#000000",
        social_value: "/styliofficial",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: createId(),
      template_id: "draft",
      element_type: "text_dynamic",
      x_mm: 22.7,
      y_mm: 57,
      width_mm: 18,
      height_mm: 2.6,
      z_index: 10,
      properties: {
        field: "instagram_handle",
        label: "",
        label_weight: "normal",
        value_weight: "normal",
        font_size: 5.8,
        alignment: "left",
        color: "#000000",
        social_value: "/styli_official",
      },
      created_at: now,
      updated_at: now,
    },
  ];
}

function createStarterState(preset: string | null): {
  template: StickerTemplateDraft;
  elements: StickerElement[];
} {
  if (preset === "styli") {
    return {
      template: { ...STYLI_STARTER_TEMPLATE },
      elements: createStyliStarterElements(),
    };
  }
  return {
    template: { ...DEFAULT_TEMPLATE },
    elements: [],
  };
}

function sampleTextForElement(element: StickerElement): string {
  if (element.element_type === "text_static") {
    return String(element.properties.content ?? "");
  }
  if (element.element_type === "text_dynamic") {
    const field = String(element.properties.field ?? "po_number");
    if (SOCIAL_FIELDS.has(field)) {
      return String(element.properties.social_value ?? "");
    }
    const value =
      field === "custom"
        ? String(element.properties.custom_formula ?? "styli_sku")
        : (SAMPLE_VALUES[field] ?? field);
    return `${String(element.properties.label ?? "")}${value}`;
  }
  if (element.element_type === "barcode") {
    return String(element.properties.field ?? "option_id")
      .replace(/_/g, " ")
      .toUpperCase();
  }
  return "";
}

function getSocialPreview(
  field: string,
): { label: string; text: string; background: string; foreground: string } | null {
  const previews: Record<
    string,
    { label: string; text: string; background: string; foreground: string }
  > = {
    instagram_handle: {
      label: "I",
      text: SAMPLE_VALUES.instagram_handle,
      background: "#E1306C",
      foreground: "#FFFFFF",
    },
    website_url: {
      label: "W",
      text: SAMPLE_VALUES.website_url,
      background: "#3B3B3B",
      foreground: "#FFFFFF",
    },
    facebook_handle: {
      label: "F",
      text: SAMPLE_VALUES.facebook_handle,
      background: "#1877F2",
      foreground: "#FFFFFF",
    },
    snapchat_handle: {
      label: "S",
      text: SAMPLE_VALUES.snapchat_handle,
      background: "#FFFC00",
      foreground: "#000000",
    },
  };
  return previews[field] ?? null;
}

function Handle({
  position,
  onPointerDown,
}: {
  position: ResizeHandle;
  onPointerDown: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
}): JSX.Element {
  const positionClass: Record<ResizeHandle, string> = {
    nw: "-left-1.5 -top-1.5 cursor-nwse-resize",
    n: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize",
    ne: "-right-1.5 -top-1.5 cursor-nesw-resize",
    e: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
    se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
    s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
    sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
    w: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
  };
  return (
    <button
      className={`absolute h-3 w-3 rounded-full border border-blue-600 bg-white ${positionClass[position]}`}
      onPointerDown={(event) => onPointerDown(position, event)}
      type="button"
    />
  );
}

function CanvasElement({
  element,
  scale,
  selected,
  onSelect,
  onResizeStart,
}: {
  element: StickerElement;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
  });
  const style = {
    left: `${element.x_mm * scale}px`,
    top: `${element.y_mm * scale}px`,
    width: `${element.width_mm * scale}px`,
    height: `${element.height_mm * scale}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: element.z_index + (selected ? 100 : 1),
  };

  const fontSize = Number(element.properties.font_size ?? 10) * (scale / MM_TO_PX) * 0.9;
  const alignClass =
    element.properties.alignment === "right"
      ? "items-end text-right"
      : element.properties.alignment === "center"
        ? "items-center text-center"
        : "items-start text-left";

  return (
    <div
      {...attributes}
      {...listeners}
      className={`absolute select-none ${selected ? "cursor-move" : ""}`}
      onMouseDown={() => onSelect(element.id)}
      ref={setNodeRef}
      style={style}
    >
      <div
        className={`flex h-full w-full overflow-hidden rounded-sm border ${
          selected ? "border-dashed border-blue-600 bg-blue-50/40" : "border-transparent"
        } ${isDragging ? "opacity-70" : "opacity-100"} ${alignClass}`}
      >
        {element.element_type === "barcode" ? (
          <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-kira-midgray bg-kira-warmgray/10 text-[10px] text-kira-darkgray">
            <div className="h-5 w-4/5 border-y border-kira-darkgray/50" />
            <span className="mt-1">{sampleTextForElement(element)}</span>
          </div>
        ) : null}
        {element.element_type === "image" ? (
          resolveStickerAssetUrl(String(element.properties.asset_url ?? "")) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Sticker asset"
              className="h-full w-full object-contain"
              src={resolveStickerAssetUrl(String(element.properties.asset_url ?? "")) ?? ""}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border border-dashed border-kira-midgray text-[10px] text-kira-midgray">
              Image
            </div>
          )
        ) : null}
        {element.element_type === "line" ? (
          <div className="relative h-full w-full">
            <div
              className="absolute bg-kira-black"
              style={
                String(element.properties.orientation ?? "horizontal") === "vertical"
                  ? {
                      left: "50%",
                      top: 0,
                      width: `${element.width_mm > 2 ? 2 : 1}px`,
                      height: "100%",
                    }
                  : {
                      left: 0,
                      top: "50%",
                      width: "100%",
                      height: `${Number(element.properties.thickness_pt ?? 1)}px`,
                    }
              }
            />
          </div>
        ) : null}
        {element.element_type === "text_static" || element.element_type === "text_dynamic"
          ? (() => {
              const socialPreview =
                element.element_type === "text_dynamic"
                  ? getSocialPreview(String(element.properties.field ?? ""))
                  : null;
              if (socialPreview) {
                const socialText = String(element.properties.social_value ?? "").trim();
                return (
                  <div className="flex h-full w-full min-w-0 items-center gap-1 px-1 py-0.5 text-kira-black">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: socialPreview.background,
                        color: socialPreview.foreground,
                      }}
                    >
                      {socialPreview.label}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate"
                      style={{
                        fontSize: `${Math.max(6, fontSize)}px`,
                        color: String(element.properties.color ?? "#000000"),
                      }}
                    >
                      {socialText}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  className="flex h-full w-full px-1 py-0.5 text-kira-black"
                  style={{
                    fontSize: `${Math.max(6, fontSize)}px`,
                    fontWeight:
                      element.element_type === "text_static"
                        ? String(element.properties.font_weight ?? "normal") === "bold"
                          ? 700
                          : 400
                        : String(element.properties.value_weight ?? "bold") === "bold"
                          ? 700
                          : 400,
                    color: String(element.properties.color ?? "#000000"),
                  }}
                >
                  <span className="w-full truncate">{sampleTextForElement(element)}</span>
                </div>
              );
            })()
          : null}
      </div>
      {selected ? (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <Handle key={handle} onPointerDown={onResizeStart} position={handle} />
          ))}
        </>
      ) : null}
    </div>
  );
}

export function StickerBuilderView(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const preset = searchParams.get("preset");
  const {
    template,
    elements,
    selectedElementId,
    history,
    redoStack,
    gridSnap,
    zoom,
    setTemplate,
    updateTemplate,
    addElement,
    setElementFrame,
    updateElement,
    deleteElement: removeElement,
    selectElement,
    pushHistory,
    undo,
    redo,
    toggleGridSnap,
    setZoom,
  } = useStickerBuilderStore();
  const [templates, setTemplates] = useState<StickerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [dynamicField, setDynamicField] = useState("po_number");
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const scale = zoom * MM_TO_PX;
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId],
  );

  useEffect(() => {
    async function loadTemplates(): Promise<void> {
      try {
        const nextTemplates = await listStickerTemplates();
        setTemplates(nextTemplates);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load sticker templates.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadTemplates();
  }, []);

  useEffect(() => {
    if (!template) {
      const starter = createStarterState(preset);
      setTemplate(starter.template, starter.elements);
    }
  }, [preset, setTemplate, template]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementId) {
        event.preventDefault();
        removeElement(selectedElementId);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeElement, selectedElementId]);

  useEffect(() => {
    if (!resizeState || !template) {
      return undefined;
    }
    const activeResize = resizeState;
    const activeTemplate = template;

    function handlePointerMove(event: PointerEvent): void {
      const deltaX = (event.clientX - activeResize.startX) / scale;
      const deltaY = (event.clientY - activeResize.startY) / scale;
      let nextX = activeResize.origin.x_mm;
      let nextY = activeResize.origin.y_mm;
      let nextWidth = activeResize.origin.width_mm;
      let nextHeight = activeResize.origin.height_mm;

      if (activeResize.handle.includes("e")) {
        nextWidth = activeResize.origin.width_mm + deltaX;
      }
      if (activeResize.handle.includes("s")) {
        nextHeight = activeResize.origin.height_mm + deltaY;
      }
      if (activeResize.handle.includes("w")) {
        nextX = activeResize.origin.x_mm + deltaX;
        nextWidth = activeResize.origin.width_mm - deltaX;
      }
      if (activeResize.handle.includes("n")) {
        nextY = activeResize.origin.y_mm + deltaY;
        nextHeight = activeResize.origin.height_mm - deltaY;
      }

      nextWidth = clampValue(nextWidth, 1, activeTemplate.width_mm);
      nextHeight = clampValue(nextHeight, 1, activeTemplate.height_mm);
      nextX = clampValue(nextX, 0, activeTemplate.width_mm - nextWidth);
      nextY = clampValue(nextY, 0, activeTemplate.height_mm - nextHeight);

      setElementFrame(activeResize.elementId, {
        x_mm: roundValue(nextX, gridSnap),
        y_mm: roundValue(nextY, gridSnap),
        width_mm: roundValue(nextWidth, gridSnap),
        height_mm: roundValue(nextHeight, gridSnap),
      });
    }

    function handlePointerUp(): void {
      setResizeState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [gridSnap, resizeState, scale, setElementFrame, template]);

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.z_index - b.z_index),
    [elements],
  );

  const handleAddElement = (type: StickerElementType): void => {
    if (!template) {
      return;
    }
    const element = buildElement(type, template, dynamicField);
    const nextZIndex =
      elements.length === 0 ? 0 : Math.max(...elements.map((item) => item.z_index)) + 1;
    addElement({ ...element, z_index: nextZIndex });
  };

  const handleResizeStart = (
    element: StickerElement,
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
    event.stopPropagation();
    pushHistory();
    setResizeState({
      elementId: element.id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...element, properties: { ...element.properties } },
    });
  };

  const handleDragStart = (_event: DragStartEvent): void => {
    pushHistory();
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    if (!template) {
      return;
    }
    const target = elements.find((element) => element.id === String(event.active.id));
    if (!target) {
      return;
    }
    const deltaX = event.delta.x / scale;
    const deltaY = event.delta.y / scale;
    const nextX = clampValue(target.x_mm + deltaX, 0, template.width_mm - target.width_mm);
    const nextY = clampValue(target.y_mm + deltaY, 0, template.height_mm - target.height_mm);
    setElementFrame(target.id, {
      x_mm: roundValue(nextX, gridSnap),
      y_mm: roundValue(nextY, gridSnap),
    });
  };

  const handleLoadTemplate = async (templateId: string): Promise<void> => {
    try {
      setError(null);
      const fullTemplate = await getStickerTemplate(templateId);
      setTemplate(mapTemplateToDraft(fullTemplate), fullTemplate.elements);
      setStatusLine(`Loaded template "${fullTemplate.name}".`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load sticker template.");
    }
  };

  const handleSaveTemplate = async (makeDefault = false): Promise<StickerTemplate | null> => {
    if (!template) {
      return null;
    }

    const payload = {
      ...template,
      is_default: makeDefault ? true : template.is_default,
      elements: elements.map((element, index) => ({
        element_type: element.element_type,
        x_mm: element.x_mm,
        y_mm: element.y_mm,
        width_mm: element.width_mm,
        height_mm: element.height_mm,
        z_index: index,
        properties: element.properties,
      })),
    };

    try {
      setError(null);
      const savedTemplate = template.id
        ? await updateStickerTemplate(template.id, payload)
        : await createStickerTemplate(payload);
      setTemplate(mapTemplateToDraft(savedTemplate), savedTemplate.elements);
      setTemplates(await listStickerTemplates());
      setStatusLine(
        makeDefault
          ? `Saved "${savedTemplate.name}" and marked it as the default template.`
          : `Saved "${savedTemplate.name}".`,
      );
      return savedTemplate;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save sticker template.");
      return null;
    }
  };

  const handlePreview = async (): Promise<void> => {
    const saved = await handleSaveTemplate(false);
    if (!saved) {
      return;
    }
    try {
      const blob = await previewStickerTemplatePdf(saved.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Failed to preview sticker template.",
      );
    }
  };

  const handleUseTemplate = async (): Promise<void> => {
    const saved = await handleSaveTemplate(true);
    if (saved) {
      updateTemplate({ is_default: true });
      if (returnTo) {
        const separator = returnTo.includes("?") ? "&" : "?";
        router.push(`${returnTo}${separator}templateId=${encodeURIComponent(saved.id)}`);
        return;
      }
    }
  };

  const handleDeleteTemplate = async (): Promise<void> => {
    if (!template?.id) {
      const starter = createStarterState(preset);
      setTemplate(starter.template, starter.elements);
      setStatusLine(
        preset === "styli"
          ? "Started a new Styli-like starter template."
          : "Started a fresh sticker template.",
      );
      return;
    }
    try {
      await deleteStickerTemplate(template.id);
      setTemplates(await listStickerTemplates());
      const starter = createStarterState(preset);
      setTemplate(starter.template, starter.elements);
      setStatusLine(
        preset === "styli"
          ? "Deleted template and restored the Styli-like starter."
          : "Deleted sticker template.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete sticker template.",
      );
    }
  };

  const handleTemplateField = <K extends keyof StickerTemplateDraft>(
    key: K,
    value: StickerTemplateDraft[K],
  ): void => {
    updateTemplate({ [key]: value } as Partial<StickerTemplateDraft>);
  };

  const handleSelectedElementUpdate = (updates: Partial<StickerElement>): void => {
    if (!selectedElement) {
      return;
    }
    updateElement(selectedElement.id, updates);
  };

  const handleSelectedPropertyUpdate = (key: string, value: unknown): void => {
    if (!selectedElement) {
      return;
    }
    handleSelectedElementUpdate({
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || !selectedElement) {
      return;
    }
    try {
      const uploaded = await uploadStickerImage(file);
      handleSelectedPropertyUpdate("asset_url", uploaded.url);
      setStatusLine("Image uploaded to sticker assets.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
    } finally {
      event.target.value = "";
    }
  };

  const canvasWidth = (template?.width_mm ?? DEFAULT_TEMPLATE.width_mm) * scale;
  const canvasHeight = (template?.height_mm ?? DEFAULT_TEMPLATE.height_mm) * scale;

  return (
    <DashboardShell
      subtitle="Build lightweight marketplace sticker layouts, preview them as PDFs, and save them for Received PO barcode generation."
      title="Sticker Builder"
    >
      <div className="space-y-5">
        {returnTo ? (
          <Card className="p-4 text-sm text-kira-darkgray">
            You opened the builder from Barcode Sheet. Save the template and use `Use template` to
            go back with the new template selected.
          </Card>
        ) : null}
        {loading ? (
          <Card className="p-4 text-sm text-kira-darkgray">Loading sticker templates...</Card>
        ) : null}
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        {statusLine ? <Card className="p-4 text-sm text-kira-darkgray">{statusLine}</Card> : null}

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card className="space-y-3 p-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">Templates</p>
                <select
                  className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "__new__") {
                      const starter = createStarterState(preset);
                      setTemplate(starter.template, starter.elements);
                      setStatusLine(
                        preset === "styli"
                          ? "Started a new Styli-like starter template."
                          : "Started a fresh sticker template.",
                      );
                      return;
                    }
                    void handleLoadTemplate(value);
                  }}
                  value={template?.id ?? "__new__"}
                >
                  <option value="__new__">New template</option>
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.is_default ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const starter = createStarterState(preset);
                    setTemplate(starter.template, starter.elements);
                    setStatusLine(
                      preset === "styli"
                        ? "Reset to the Styli-like starter template."
                        : "Started a fresh sticker template.",
                    );
                  }}
                  variant="secondary"
                >
                  New
                </Button>
                <Button onClick={() => void handleDeleteTemplate()} variant="secondary">
                  Delete
                </Button>
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">Add Element</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAddElement("text_static")} variant="secondary">
                  Text
                </Button>
                <Button onClick={() => handleAddElement("barcode")} variant="secondary">
                  Barcode
                </Button>
                <Button onClick={() => handleAddElement("image")} variant="secondary">
                  Image
                </Button>
                <Button onClick={() => handleAddElement("line")} variant="secondary">
                  Line
                </Button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-kira-darkgray">
                  Dynamic field
                  <select
                    className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2 text-sm"
                    onChange={(event) => setDynamicField(event.target.value)}
                    value={dynamicField}
                  >
                    {DYNAMIC_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => handleAddElement("text_dynamic")} variant="secondary">
                  Add dynamic field
                </Button>
              </div>
            </Card>

            <Card className="space-y-4 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">Properties</p>
              {!selectedElement ? (
                <p className="text-sm text-kira-darkgray">
                  Select an element to edit its settings.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {(selectedElement.element_type === "text_static" ||
                    selectedElement.element_type === "text_dynamic") && (
                    <>
                      {selectedElement.element_type === "text_static" ? (
                        <label className="block">
                          Content
                          <textarea
                            className="kira-focus-ring mt-1 min-h-20 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("content", event.target.value)
                            }
                            value={String(selectedElement.properties.content ?? "")}
                          />
                        </label>
                      ) : (
                        <>
                          <label className="block">
                            Field
                            <select
                              className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                              onChange={(event) => {
                                const nextField = event.target.value;
                                handleSelectedPropertyUpdate("field", nextField);
                                if (SOCIAL_FIELDS.has(nextField)) {
                                  handleSelectedElementUpdate({
                                    properties: {
                                      ...selectedElement.properties,
                                      field: nextField,
                                      label: "",
                                      alignment: String(
                                        selectedElement.properties.alignment ?? "left",
                                      ),
                                    },
                                  });
                                }
                              }}
                              value={String(selectedElement.properties.field ?? "po_number")}
                            >
                              {DYNAMIC_FIELDS.map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {!SOCIAL_FIELDS.has(String(selectedElement.properties.field ?? "")) ? (
                            <label className="block">
                              Label prefix
                              <input
                                className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                                onChange={(event) =>
                                  handleSelectedPropertyUpdate("label", event.target.value)
                                }
                                type="text"
                                value={String(selectedElement.properties.label ?? "")}
                              />
                            </label>
                          ) : null}
                          {SOCIAL_FIELDS.has(String(selectedElement.properties.field ?? "")) ? (
                            <label className="block">
                              Handle / URL
                              <input
                                className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                                onChange={(event) =>
                                  handleSelectedPropertyUpdate("social_value", event.target.value)
                                }
                                placeholder={
                                  String(selectedElement.properties.field ?? "") === "website_url"
                                    ? "website.com"
                                    : "/handle_name"
                                }
                                type="text"
                                value={String(selectedElement.properties.social_value ?? "")}
                              />
                            </label>
                          ) : null}
                          {String(selectedElement.properties.field ?? "") === "custom" ? (
                            <label className="block">
                              Custom formula
                              <input
                                className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                                onChange={(event) =>
                                  handleSelectedPropertyUpdate("custom_formula", event.target.value)
                                }
                                type="text"
                                value={String(selectedElement.properties.custom_formula ?? "")}
                              />
                            </label>
                          ) : null}
                        </>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          Font size
                          <input
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            max={24}
                            min={6}
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("font_size", Number(event.target.value))
                            }
                            type="number"
                            value={Number(selectedElement.properties.font_size ?? 10)}
                          />
                        </label>
                        <label className="block">
                          Alignment
                          <select
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("alignment", event.target.value)
                            }
                            value={String(selectedElement.properties.alignment ?? "center")}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedElement.element_type === "text_static" ? (
                          <label className="block">
                            Font weight
                            <select
                              className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                              onChange={(event) =>
                                handleSelectedPropertyUpdate("font_weight", event.target.value)
                              }
                              value={String(selectedElement.properties.font_weight ?? "normal")}
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </label>
                        ) : (
                          <>
                            <label className="block">
                              Label weight
                              <select
                                className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                                onChange={(event) =>
                                  handleSelectedPropertyUpdate("label_weight", event.target.value)
                                }
                                value={String(selectedElement.properties.label_weight ?? "normal")}
                              >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                              </select>
                            </label>
                            <label className="block">
                              Value weight
                              <select
                                className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                                onChange={(event) =>
                                  handleSelectedPropertyUpdate("value_weight", event.target.value)
                                }
                                value={String(selectedElement.properties.value_weight ?? "bold")}
                              >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                              </select>
                            </label>
                          </>
                        )}
                        <label className="block">
                          Color
                          <input
                            className="mt-1 h-10 w-full rounded-md border border-kira-warmgray/35 bg-white px-1 py-1"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("color", event.target.value)
                            }
                            type="color"
                            value={String(selectedElement.properties.color ?? "#000000")}
                          />
                        </label>
                      </div>
                    </>
                  )}

                  {selectedElement.element_type === "barcode" ? (
                    <>
                      <label className="block">
                        Encode field
                        <select
                          className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                          onChange={(event) =>
                            handleSelectedPropertyUpdate("field", event.target.value)
                          }
                          value={String(selectedElement.properties.field ?? "option_id")}
                        >
                          {BARCODE_FIELDS.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {String(selectedElement.properties.field ?? "") === "custom_formula" ? (
                        <label className="block">
                          Custom formula
                          <input
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("custom_formula", event.target.value)
                            }
                            type="text"
                            value={String(selectedElement.properties.custom_formula ?? "")}
                          />
                        </label>
                      ) : null}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          Barcode type
                          <select
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("barcode_type", event.target.value)
                            }
                            value={String(selectedElement.properties.barcode_type ?? "code128")}
                          >
                            <option value="code128">Code128</option>
                            <option value="code39">Code39</option>
                            <option value="qr">QR</option>
                          </select>
                        </label>
                        <label className="block">
                          Number font size
                          <input
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            min={6}
                            onChange={(event) =>
                              handleSelectedPropertyUpdate(
                                "number_font_size",
                                Number(event.target.value),
                              )
                            }
                            type="number"
                            value={Number(selectedElement.properties.number_font_size ?? 7)}
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-kira-darkgray">
                        <input
                          checked={Boolean(selectedElement.properties.show_number ?? true)}
                          onChange={(event) =>
                            handleSelectedPropertyUpdate("show_number", event.target.checked)
                          }
                          type="checkbox"
                        />
                        Show number below
                      </label>
                    </>
                  ) : null}

                  {selectedElement.element_type === "image" ? (
                    <>
                      <label className="block">
                        Asset type
                        <select
                          className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                          onChange={(event) =>
                            handleSelectedPropertyUpdate("asset_type", event.target.value)
                          }
                          value={String(selectedElement.properties.asset_type ?? "logo")}
                        >
                          <option value="logo">Company logo</option>
                          <option value="custom">Upload custom</option>
                        </select>
                      </label>
                      <label className="block">
                        Fit
                        <select
                          className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                          onChange={(event) =>
                            handleSelectedPropertyUpdate("fit", event.target.value)
                          }
                          value={String(selectedElement.properties.fit ?? "contain")}
                        >
                          <option value="contain">Contain</option>
                          <option value="cover">Cover</option>
                        </select>
                      </label>
                      <label className="block">
                        Upload image
                        <input
                          className="mt-1 block w-full text-sm text-kira-darkgray"
                          onChange={(event) => void handleImageUpload(event)}
                          type="file"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedElement.element_type === "line" ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          Orientation
                          <select
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate("orientation", event.target.value)
                            }
                            value={String(selectedElement.properties.orientation ?? "horizontal")}
                          >
                            <option value="horizontal">Horizontal</option>
                            <option value="vertical">Vertical</option>
                          </select>
                        </label>
                        <label className="block">
                          Thickness
                          <select
                            className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                            onChange={(event) =>
                              handleSelectedPropertyUpdate(
                                "thickness_pt",
                                Number(event.target.value),
                              )
                            }
                            value={String(selectedElement.properties.thickness_pt ?? 0.5)}
                          >
                            <option value="0.5">0.5pt</option>
                            <option value="1">1pt</option>
                            <option value="2">2pt</option>
                          </select>
                        </label>
                      </div>
                      <label className="block">
                        Color
                        <input
                          className="mt-1 h-10 w-full rounded-md border border-kira-warmgray/35 bg-white px-1 py-1"
                          onChange={(event) =>
                            handleSelectedPropertyUpdate("color", event.target.value)
                          }
                          type="color"
                          value={String(selectedElement.properties.color ?? "#000000")}
                        />
                      </label>
                    </>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    {(["x_mm", "y_mm", "width_mm", "height_mm"] as const).map((field) => (
                      <label className="block" key={field}>
                        {field.replace("_mm", "").toUpperCase()} (mm)
                        <input
                          className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                          onChange={(event) =>
                            handleSelectedElementUpdate({
                              [field]: Number(event.target.value),
                            } as Partial<StickerElement>)
                          }
                          step="0.01"
                          type="number"
                          value={Number(selectedElement[field]).toFixed(2)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="space-y-4 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block text-sm">
                  Sticker width (mm)
                  <input
                    className="kira-focus-ring mt-1 w-28 rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                    onChange={(event) =>
                      handleTemplateField("width_mm", Number(event.target.value))
                    }
                    step="0.01"
                    type="number"
                    value={template?.width_mm ?? DEFAULT_TEMPLATE.width_mm}
                  />
                </label>
                <label className="block text-sm">
                  Sticker height (mm)
                  <input
                    className="kira-focus-ring mt-1 w-28 rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                    onChange={(event) =>
                      handleTemplateField("height_mm", Number(event.target.value))
                    }
                    step="0.01"
                    type="number"
                    value={template?.height_mm ?? DEFAULT_TEMPLATE.height_mm}
                  />
                </label>
                <label className="block text-sm">
                  Border
                  <input
                    className="mt-1 h-10 w-14 rounded-md border border-kira-warmgray/35 bg-white px-1 py-1"
                    onChange={(event) => handleTemplateField("border_color", event.target.value)}
                    type="color"
                    value={template?.border_color ?? "#000000"}
                  />
                </label>
                <label className="block text-sm">
                  Radius
                  <input
                    className="kira-focus-ring mt-1 w-24 rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                    onChange={(event) =>
                      handleTemplateField("border_radius_mm", Number(event.target.value))
                    }
                    step="0.1"
                    type="number"
                    value={template?.border_radius_mm ?? DEFAULT_TEMPLATE.border_radius_mm}
                  />
                </label>
                <label className="block text-sm">
                  Background
                  <input
                    className="mt-1 h-10 w-14 rounded-md border border-kira-warmgray/35 bg-white px-1 py-1"
                    onChange={(event) =>
                      handleTemplateField("background_color", event.target.value)
                    }
                    type="color"
                    value={template?.background_color ?? DEFAULT_TEMPLATE.background_color}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-kira-darkgray">
                  <input checked={gridSnap} onChange={toggleGridSnap} type="checkbox" />
                  Grid snap
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((level) => (
                    <Button
                      key={level}
                      onClick={() => setZoom(level)}
                      variant={zoom === level ? "primary" : "secondary"}
                    >
                      {level}x
                    </Button>
                  ))}
                </div>
                <Button disabled={history.length === 0} onClick={undo} variant="secondary">
                  Undo
                </Button>
                <Button disabled={redoStack.length === 0} onClick={redo} variant="secondary">
                  Redo
                </Button>
              </div>

              <div className="overflow-auto rounded-xl border border-kira-warmgray/30 bg-[radial-gradient(circle_at_top,#f4efe8,transparent_55%),linear-gradient(180deg,#fffdf8,#f8f2ea)] p-6">
                <div className="flex min-h-[520px] items-center justify-center">
                  <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                    <div
                      className="relative shadow-[0_18px_60px_rgba(84,57,31,0.12)]"
                      onMouseDown={(event) => {
                        if (event.target === canvasRef.current) {
                          selectElement(null);
                        }
                      }}
                      ref={canvasRef}
                      style={{
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                        backgroundColor:
                          template?.background_color ?? DEFAULT_TEMPLATE.background_color,
                        border: template?.border_color
                          ? `1px solid ${template.border_color}`
                          : "1px solid transparent",
                        borderRadius: `${(template?.border_radius_mm ?? DEFAULT_TEMPLATE.border_radius_mm) * scale}px`,
                        backgroundImage: gridSnap
                          ? "linear-gradient(to right, rgba(84,57,31,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(84,57,31,0.08) 1px, transparent 1px)"
                          : "none",
                        backgroundSize: `${scale}px ${scale}px`,
                      }}
                    >
                      {sortedElements.map((element) => (
                        <CanvasElement
                          element={element}
                          key={element.id}
                          onResizeStart={(handle, event) =>
                            handleResizeStart(element, handle, event)
                          }
                          onSelect={selectElement}
                          scale={scale}
                          selected={selectedElementId === element.id}
                        />
                      ))}
                    </div>
                  </DndContext>
                </div>
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[240px] flex-1 text-sm">
                  Template name
                  <input
                    className="kira-focus-ring mt-1 w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                    onChange={(event) => handleTemplateField("name", event.target.value)}
                    type="text"
                    value={template?.name ?? ""}
                  />
                </label>
                <Button onClick={() => void handleSaveTemplate(false)}>Save template</Button>
                <Button onClick={() => void handlePreview()} variant="secondary">
                  Preview PDF
                </Button>
                <Button onClick={() => void handleUseTemplate()} variant="secondary">
                  {returnTo ? "Use template and return" : "Use template"}
                </Button>
                <Button
                  onClick={async () => {
                    const ordered = [...elements]
                      .sort((a, b) => a.z_index - b.z_index)
                      .map((element) => element.id);
                    if (template?.id) {
                      await reorderStickerTemplateElements(template.id, ordered);
                    }
                    setStatusLine("Element order synced.");
                  }}
                  variant="secondary"
                >
                  Sync order
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
