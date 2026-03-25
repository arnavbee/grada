"use client";

import { useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { PackingListCarton, ReceivedPOLineItem } from "@/src/lib/received-po";
import { CartonDraftState } from "@/src/lib/received-po-ui";

interface CartonBreakdownProps {
  cartons: PackingListCarton[];
  lineItems: ReceivedPOLineItem[];
  drafts: Record<string, CartonDraftState>;
  onChange: (cartonId: string, field: keyof CartonDraftState, value: string) => void;
  onSave: (cartonId: string) => void;
  savingCartonId: string | null;
  expandAll?: boolean;
}

export function CartonBreakdown({
  cartons,
  lineItems,
  drafts,
  onChange,
  onSave,
  savingCartonId,
  expandAll = false,
}: CartonBreakdownProps): JSX.Element {
  const [expandedCartons, setExpandedCartons] = useState<Record<string, boolean>>({});
  const [showAllCartons, setShowAllCartons] = useState(false);
  const lineItemsById = useMemo(
    () => Object.fromEntries(lineItems.map((item) => [item.id, item])),
    [lineItems],
  );

  const visibleCartons = expandAll || showAllCartons ? cartons : cartons.slice(0, 3);

  return (
    <div className="space-y-4">
      {visibleCartons.map((carton) => {
        const draft = drafts[carton.id] ?? {
          gross_weight: carton.gross_weight?.toString() ?? "",
          net_weight: carton.net_weight?.toString() ?? "",
          dimensions: carton.dimensions ?? "",
        };
        const itemsExpanded = expandAll || Boolean(expandedCartons[carton.id]);
        return (
          <div
            className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/50 p-4 dark:border-white/10 dark:bg-white/5"
            key={carton.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-kira-black dark:text-white">
                  Carton {carton.carton_number}
                </h3>
                <p className="mt-1 text-sm text-kira-darkgray dark:text-gray-300">
                  {carton.total_pieces} pieces assigned
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!expandAll ? (
                  <Button
                    onClick={() =>
                      setExpandedCartons((current) => ({
                        ...current,
                        [carton.id]: !current[carton.id],
                      }))
                    }
                    variant="secondary"
                  >
                    {itemsExpanded ? "Hide items" : `Show items (${carton.items.length})`}
                  </Button>
                ) : null}
                <Button
                  disabled={savingCartonId === carton.id}
                  onClick={() => onSave(carton.id)}
                  variant="secondary"
                >
                  {savingCartonId === carton.id ? "Saving..." : "Save carton"}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                  Gross weight (kg)
                </span>
                <input
                  className="kira-field w-full"
                  min="0"
                  onChange={(event) => onChange(carton.id, "gross_weight", event.target.value)}
                  step="0.01"
                  type="number"
                  value={draft.gross_weight}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                  Net weight (kg)
                </span>
                <input
                  className="kira-field w-full"
                  min="0"
                  onChange={(event) => onChange(carton.id, "net_weight", event.target.value)}
                  step="0.01"
                  type="number"
                  value={draft.net_weight}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-kira-darkgray dark:text-gray-200">Dimensions</span>
                <input
                  className="kira-field w-full"
                  onChange={(event) => onChange(carton.id, "dimensions", event.target.value)}
                  placeholder="60x40x40 cm"
                  type="text"
                  value={draft.dimensions}
                />
              </label>
            </div>
            {itemsExpanded ? (
              <ul className="mt-4 space-y-2 text-sm text-kira-darkgray dark:text-gray-300">
                {carton.items.map((item) => {
                  const lineItem = lineItemsById[item.line_item_id];
                  const primaryLabel = lineItem
                    ? [
                        lineItem.brand_style_code ? `Style ${lineItem.brand_style_code}` : null,
                        lineItem.color ? lineItem.color : null,
                        lineItem.size ? `Size ${lineItem.size}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || `SKU ${lineItem.sku_id}`
                    : "Line item";
                  const secondaryLabel = lineItem
                    ? [
                        lineItem.option_id ? `Option ${lineItem.option_id}` : null,
                        lineItem.model_number ? `Model ${lineItem.model_number}` : null,
                        lineItem.sku_id ? `SKU ${lineItem.sku_id}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : item.line_item_id;

                  return (
                    <li className="rounded-md bg-white/75 px-3 py-2 dark:bg-white/10" key={item.id}>
                      <p className="font-medium text-kira-black dark:text-white">{primaryLabel}</p>
                      <p className="mt-1 text-xs text-kira-darkgray dark:text-white/65">
                        {secondaryLabel}
                      </p>
                      <p className="mt-2 text-xs font-medium text-kira-black dark:text-white/80">
                        {item.pieces_in_carton} pcs
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
      {cartons.length > 3 && !expandAll ? (
        <div className="flex justify-center">
          <Button onClick={() => setShowAllCartons((current) => !current)} variant="secondary">
            {showAllCartons ? "Show fewer cartons" : `Show all cartons (${cartons.length})`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
