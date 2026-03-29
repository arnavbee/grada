"use client";

import { useEffect, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { InputField } from "@/src/components/ui/input-field";
import {
  type CartonCapacityRule,
  createCartonRule,
  deleteCartonRule,
  listCartonRules,
  updateCartonRule,
} from "@/src/lib/settings";

interface RuleDraft {
  category: string;
  pieces_per_carton: string;
  is_default: boolean;
}

interface PackingRulesPanelProps {
  className?: string;
}

const DEFAULT_RULE_DRAFTS: RuleDraft[] = [
  { category: "Dresses", pieces_per_carton: "20", is_default: true },
  { category: "Tops", pieces_per_carton: "25", is_default: false },
  { category: "Co-ord Sets", pieces_per_carton: "15", is_default: false },
];

export function PackingRulesPanel({ className }: PackingRulesPanelProps = {}): JSX.Element {
  const [rules, setRules] = useState<CartonCapacityRule[]>([]);
  const [newRuleDrafts, setNewRuleDrafts] = useState<RuleDraft[]>(DEFAULT_RULE_DRAFTS);
  const [loading, setLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRules(): Promise<void> {
      try {
        const cartonRules = await listCartonRules();
        if (!active) {
          return;
        }
        setRules(cartonRules);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load carton rules.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRules();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveExistingRule = async (rule: CartonCapacityRule): Promise<void> => {
    try {
      setSavingRuleId(rule.id);
      setError(null);
      setMessage(null);
      const saved = await updateCartonRule(rule.id, {
        category: rule.category,
        pieces_per_carton: rule.pieces_per_carton,
        is_default: rule.is_default,
      });
      setRules((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setMessage(`Saved carton rule for ${saved.category}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save carton rule.");
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleAddRule = async (draft: RuleDraft, index: number): Promise<void> => {
    try {
      setSavingRuleId(`new-${index}`);
      setError(null);
      setMessage(null);
      const saved = await createCartonRule({
        category: draft.category,
        pieces_per_carton: Number(draft.pieces_per_carton) || 0,
        is_default: draft.is_default,
      });
      setRules((current) =>
        [...current, saved].sort((left, right) => left.category.localeCompare(right.category)),
      );
      setMessage(`Added carton rule for ${saved.category}.`);
      setNewRuleDrafts((current) =>
        current.map((entry, entryIndex) =>
          entryIndex === index ? { category: "", pieces_per_carton: "", is_default: false } : entry,
        ),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create carton rule.");
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId: string): Promise<void> => {
    try {
      setSavingRuleId(ruleId);
      setError(null);
      setMessage(null);
      await deleteCartonRule(ruleId);
      setRules((current) => current.filter((rule) => rule.id !== ruleId));
      setMessage("Carton rule deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete carton rule.",
      );
    } finally {
      setSavingRuleId(null);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-kira-warmgray/40 p-4 text-sm text-kira-warmgray">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-2xl border border-kira-midgray/30 p-4 text-sm text-kira-darkgray">
            {message}
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-2xl border border-kira-warmgray/35 p-4 text-sm text-kira-midgray">
            Loading packing rules...
          </div>
        ) : null}

        {rules.map((rule) => (
          <div className="rounded-2xl border border-kira-warmgray/35 p-4" key={rule.id}>
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto] md:items-end">
              <InputField
                label="Category"
                onChange={(event) =>
                  setRules((current) =>
                    current.map((item) =>
                      item.id === rule.id ? { ...item, category: event.target.value } : item,
                    ),
                  )
                }
                value={rule.category}
              />
              <InputField
                label="Pieces per carton"
                min="1"
                onChange={(event) =>
                  setRules((current) =>
                    current.map((item) =>
                      item.id === rule.id
                        ? { ...item, pieces_per_carton: Number(event.target.value) || 0 }
                        : item,
                    ),
                  )
                }
                type="number"
                value={rule.pieces_per_carton}
              />
              <label className="flex items-center gap-2 text-sm text-kira-darkgray md:pb-3">
                <input
                  checked={rule.is_default}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item) => ({
                        ...item,
                        is_default: item.id === rule.id ? event.target.checked : item.is_default,
                      })),
                    )
                  }
                  type="checkbox"
                />
                Default
              </label>
              <div className="flex gap-2 md:pb-2">
                <Button
                  disabled={savingRuleId === rule.id}
                  onClick={() => void handleSaveExistingRule(rule)}
                >
                  {savingRuleId === rule.id ? "Saving..." : "Save"}
                </Button>
                <Button
                  disabled={savingRuleId === rule.id}
                  onClick={() => void handleDeleteRule(rule.id)}
                  variant="secondary"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="grid gap-4 lg:grid-cols-3">
          {newRuleDrafts.map((draft, index) => (
            <div
              className="rounded-2xl border border-dashed border-kira-warmgray/45 p-4"
              key={`draft-${index}`}
            >
              <div className="space-y-3">
                <InputField
                  label="Category"
                  onChange={(event) =>
                    setNewRuleDrafts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, category: event.target.value } : entry,
                      ),
                    )
                  }
                  value={draft.category}
                />
                <InputField
                  label="Pieces per carton"
                  min="1"
                  onChange={(event) =>
                    setNewRuleDrafts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, pieces_per_carton: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  type="number"
                  value={draft.pieces_per_carton}
                />
                <label className="flex items-center gap-2 text-sm text-kira-darkgray">
                  <input
                    checked={draft.is_default}
                    onChange={(event) =>
                      setNewRuleDrafts((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, is_default: event.target.checked }
                            : entry,
                        ),
                      )
                    }
                    type="checkbox"
                  />
                  Mark as default
                </label>
                <Button
                  className="w-full"
                  disabled={
                    savingRuleId === `new-${index}` ||
                    !draft.category.trim() ||
                    !draft.pieces_per_carton.trim()
                  }
                  onClick={() => void handleAddRule(draft, index)}
                >
                  {savingRuleId === `new-${index}` ? "Adding..." : "Add rule"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
