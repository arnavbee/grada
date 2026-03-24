"use client";

import { Button } from "@/src/components/ui/button";
import { PackingListCarton } from "@/src/lib/received-po";
import { CartonDraftState } from "@/src/lib/received-po-ui";

interface CartonBreakdownProps {
  cartons: PackingListCarton[];
  drafts: Record<string, CartonDraftState>;
  onChange: (cartonId: string, field: keyof CartonDraftState, value: string) => void;
  onSave: (cartonId: string) => void;
  savingCartonId: string | null;
}

export function CartonBreakdown({
  cartons,
  drafts,
  onChange,
  onSave,
  savingCartonId,
}: CartonBreakdownProps): JSX.Element {
  return (
    <div className="space-y-4">
      {cartons.map((carton) => {
        const draft = drafts[carton.id] ?? {
          gross_weight: carton.gross_weight?.toString() ?? "",
          net_weight: carton.net_weight?.toString() ?? "",
          dimensions: carton.dimensions ?? "",
        };
        return (
          <div
            className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/50 p-4"
            key={carton.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-kira-black">
                  Carton {carton.carton_number}
                </h3>
                <p className="mt-1 text-sm text-kira-darkgray">
                  {carton.total_pieces} pieces assigned
                </p>
              </div>
              <Button
                disabled={savingCartonId === carton.id}
                onClick={() => onSave(carton.id)}
                variant="secondary"
              >
                {savingCartonId === carton.id ? "Saving..." : "Save carton"}
              </Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray">Gross weight (kg)</span>
                <input
                  className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                  min="0"
                  onChange={(event) => onChange(carton.id, "gross_weight", event.target.value)}
                  step="0.01"
                  type="number"
                  value={draft.gross_weight}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray">Net weight (kg)</span>
                <input
                  className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                  min="0"
                  onChange={(event) => onChange(carton.id, "net_weight", event.target.value)}
                  step="0.01"
                  type="number"
                  value={draft.net_weight}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray">Dimensions</span>
                <input
                  className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                  onChange={(event) => onChange(carton.id, "dimensions", event.target.value)}
                  placeholder="60x40x40 cm"
                  type="text"
                  value={draft.dimensions}
                />
              </label>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-kira-darkgray">
              {carton.items.map((item) => (
                <li className="rounded-md bg-white/75 px-3 py-2" key={item.id}>
                  Line item {item.line_item_id} · {item.pieces_in_carton} pcs
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
