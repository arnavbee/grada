import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { DataTable } from "@/src/components/ui/data-table";
import { InputField } from "@/src/components/ui/input-field";
import { designTokens } from "@/src/lib/design-tokens";

const previewColumns = [
  { key: "module", title: "Module" },
  { key: "status", title: "Status" },
  { key: "owner", title: "Owner" },
];

const previewRows = [
  { id: "1", values: { module: "Inventory", status: "In Progress", owner: "Ops Team" } },
  { id: "2", values: { module: "PO Parsing", status: "Review", owner: "Catalog Team" } },
  { id: "3", values: { module: "Exports", status: "Ready", owner: "Marketplace Team" } },
  { id: "4", values: { module: "Invoices", status: "Blocked", owner: "Finance" } },
  { id: "5", values: { module: "Analytics", status: "Ready", owner: "Leadership" } },
];

export default function DesignSystemPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-[1280px] space-y-6 p-4 md:p-8">
      <Card className="animate-enter p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-kira-midgray">Visual Identity</p>
            <h1>Design System</h1>
            <p className="mt-1 text-kira-darkgray">
              Core palette, hierarchy, layout rules, and component patterns for ERP-style interfaces.
            </p>
          </div>
          <Link
            className="kira-focus-ring rounded-md px-3 py-2 text-sm text-kira-darkgray hover:bg-kira-warmgray/20"
            href="/dashboard"
          >
            Back to Dashboard
          </Link>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-enter p-5" style={{ animationDelay: "80ms" }}>
          <h2>Color Palette</h2>
          <div className="mt-4 space-y-3">
            {designTokens.colors.map((color) => (
              <div className="flex items-center gap-3" key={color.hex}>
                <div className="h-10 w-10 rounded-md border border-kira-warmgray/50" style={{ backgroundColor: color.hex }} />
                <div>
                  <p className="text-sm font-semibold">{color.name}</p>
                  <small className="text-kira-midgray">
                    {color.hex} · {color.variable} · {color.usage}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-enter p-5" style={{ animationDelay: "120ms" }}>
          <h2>Typography & Layout</h2>
          <div className="mt-4 space-y-2 text-kira-darkgray">
            <p>
              <span className="font-semibold text-kira-black">Font:</span> {designTokens.typography.fontFamily}
            </p>
            <p>
              <span className="font-semibold text-kira-black">H1:</span> {designTokens.typography.h1}
            </p>
            <p>
              <span className="font-semibold text-kira-black">H2:</span> {designTokens.typography.h2}
            </p>
            <p>
              <span className="font-semibold text-kira-black">Body:</span> {designTokens.typography.body}
            </p>
            <p>
              <span className="font-semibold text-kira-black">Microcopy:</span> {designTokens.typography.microcopy}
            </p>
            <p>
              <span className="font-semibold text-kira-black">Spacing grid:</span> {designTokens.spacing.baseGrid} base
            </p>
            <p>
              <span className="font-semibold text-kira-black">Breakpoints:</span> Mobile {designTokens.breakpoints.mobile}, Tablet {designTokens.breakpoints.tablet}, Desktop {designTokens.breakpoints.desktop}
            </p>
          </div>
        </Card>
      </section>

      <Card className="animate-enter space-y-5 p-5" style={{ animationDelay: "160ms" }}>
        <h2>Component Library Preview</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="text">Text Action</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Company Name" placeholder="Enter company" />
          <InputField
            error="Please add a valid format"
            hint="Used as fallback if missing in source"
            label="SKU Pattern"
            placeholder="{BRAND}-{CATEGORY}-{COLOR}-{SIZE}"
          />
        </div>

        <DataTable columns={previewColumns} rows={previewRows} />
      </Card>
    </main>
  );
}
