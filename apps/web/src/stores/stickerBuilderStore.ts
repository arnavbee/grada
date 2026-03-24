import { create } from "zustand";

import type { StickerElement } from "@/src/lib/sticker-templates";

export interface StickerTemplateDraft {
  id?: string;
  name: string;
  width_mm: number;
  height_mm: number;
  border_color: string | null;
  border_radius_mm: number;
  background_color: string;
  is_default: boolean;
}

interface StickerBuilderState {
  template: StickerTemplateDraft | null;
  elements: StickerElement[];
  selectedElementId: string | null;
  history: StickerElement[][];
  redoStack: StickerElement[][];
  gridSnap: boolean;
  zoom: number;
  setTemplate: (template: StickerTemplateDraft | null, elements?: StickerElement[]) => void;
  updateTemplate: (updates: Partial<StickerTemplateDraft>) => void;
  replaceElements: (elements: StickerElement[]) => void;
  resetBuilder: (template?: StickerTemplateDraft | null) => void;
  addElement: (element: StickerElement) => void;
  setElementFrame: (id: string, updates: Partial<StickerElement>) => void;
  updateElement: (id: string, updates: Partial<StickerElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x_mm: number, y_mm: number) => void;
  resizeElement: (
    id: string,
    width_mm: number,
    height_mm: number,
    x_mm?: number,
    y_mm?: number,
  ) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  toggleGridSnap: () => void;
  setZoom: (zoom: number) => void;
}

function cloneElements(elements: StickerElement[]): StickerElement[] {
  return elements.map((element) => ({
    ...element,
    properties: { ...element.properties },
  }));
}

function nextHistory(history: StickerElement[][], snapshot: StickerElement[]): StickerElement[][] {
  return [...history, cloneElements(snapshot)].slice(-50);
}

export const useStickerBuilderStore = create<StickerBuilderState>((set, get) => ({
  template: null,
  elements: [],
  selectedElementId: null,
  history: [],
  redoStack: [],
  gridSnap: true,
  zoom: 3,
  setTemplate: (template, elements = []) =>
    set({
      template,
      elements: cloneElements(elements),
      selectedElementId: null,
      history: [],
      redoStack: [],
    }),
  updateTemplate: (updates) =>
    set((state) => ({
      template: state.template ? { ...state.template, ...updates } : null,
    })),
  replaceElements: (elements) =>
    set({
      elements: cloneElements(elements),
      selectedElementId: null,
      history: [],
      redoStack: [],
    }),
  resetBuilder: (template = null) =>
    set({
      template,
      elements: [],
      selectedElementId: null,
      history: [],
      redoStack: [],
    }),
  addElement: (element) =>
    set((state) => ({
      history: nextHistory(state.history, state.elements),
      redoStack: [],
      elements: [...state.elements, { ...element, properties: { ...element.properties } }],
      selectedElementId: element.id,
    })),
  setElementFrame: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id
          ? {
              ...element,
              ...updates,
              properties: updates.properties
                ? { ...updates.properties }
                : { ...element.properties },
            }
          : element,
      ),
    })),
  updateElement: (id, updates) =>
    set((state) => ({
      history: nextHistory(state.history, state.elements),
      redoStack: [],
      elements: state.elements.map((element) =>
        element.id === id
          ? {
              ...element,
              ...updates,
              properties: updates.properties
                ? { ...updates.properties }
                : { ...element.properties },
            }
          : element,
      ),
    })),
  deleteElement: (id) =>
    set((state) => ({
      history: nextHistory(state.history, state.elements),
      redoStack: [],
      elements: state.elements.filter((element) => element.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    })),
  selectElement: (id) => set({ selectedElementId: id }),
  moveElement: (id, x_mm, y_mm) => get().updateElement(id, { x_mm, y_mm }),
  resizeElement: (id, width_mm, height_mm, x_mm, y_mm) =>
    get().updateElement(id, {
      width_mm,
      height_mm,
      ...(typeof x_mm === "number" ? { x_mm } : {}),
      ...(typeof y_mm === "number" ? { y_mm } : {}),
    }),
  pushHistory: () =>
    set((state) => ({
      history: nextHistory(state.history, state.elements),
      redoStack: [],
    })),
  undo: () =>
    set((state) => {
      if (state.history.length === 0) {
        return state;
      }
      const previous = state.history[state.history.length - 1] ?? [];
      return {
        elements: cloneElements(previous),
        history: state.history.slice(0, -1),
        redoStack: [cloneElements(state.elements), ...state.redoStack].slice(0, 50),
        selectedElementId: null,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) {
        return state;
      }
      const next = state.redoStack[0] ?? [];
      return {
        elements: cloneElements(next),
        history: nextHistory(state.history, state.elements),
        redoStack: state.redoStack.slice(1),
        selectedElementId: null,
      };
    }),
  toggleGridSnap: () => set((state) => ({ gridSnap: !state.gridSnap })),
  setZoom: (zoom) => set({ zoom }),
}));
