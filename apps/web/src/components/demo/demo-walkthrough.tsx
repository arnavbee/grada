"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";

interface Step {
  title: string;
  badge: string;
  description: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    badge: "Step 1 of 4 • Welcome",
    title: "Isolated Demo Workspace Ready",
    description:
      "Welcome to Nivara Studio! Your workspace is preloaded with sample apparel catalog items, draft purchase orders, and parsed distributor data.",
    tip: "No account creation or file uploads needed — everything is ready to explore.",
  },
  {
    badge: "Step 2 of 4 • AI Vision",
    title: "Test Live AI Attribute Extraction",
    description:
      "Click the '✦ Try AI' button next to any catalog item to trigger real-time AI vision analysis.",
    tip: "Watch the AI analyze garment images to suggest style names, colors, fabrics, and confidence scores.",
  },
  {
    badge: "Step 3 of 4 • Inline Editing",
    title: "Fast Catalog Operations",
    description: "Click any Style Name or edit units and prices directly inside the table rows.",
    tip: "All changes immediately reflect across inventory and PO generation flows.",
  },
  {
    badge: "Step 4 of 4 • PO & Invoicing",
    title: "Automated Document Workflows",
    description:
      "Use the sidebar to explore PO Builder, Received POs, and Barcode Generator flows.",
    tip: "See how parsed distributor POs auto-resolve line items and flag discrepancies.",
  },
];

export function DemoWalkthrough(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const isDemo = window.sessionStorage.getItem("grada_demo_mode") === "true";
    const isDone = window.sessionStorage.getItem("grada_demo_walkthrough_done") === "true";
    if (isDemo && !isDone) {
      setIsVisible(true);
    }
  }, []);

  function handleDismiss(): void {
    setIsVisible(false);
    window.sessionStorage.setItem("grada_demo_walkthrough_done", "true");
  }

  function handleNext(): void {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  }

  function handlePrev(): void {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  const step = STEPS[currentStep];
  if (!isVisible || !step) return null;

  return (
    <aside
      aria-label="Interactive Demo Walkthrough"
      className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="surface-card rounded-2xl border border-amber-500/30 p-5 shadow-xl backdrop-blur-md bg-white/95 dark:bg-zinc-900/95">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <span>✦</span>
            <span>{step.badge}</span>
          </span>
          <button
            aria-label="Close tour"
            className="kira-focus-ring -mr-1 -mt-1 rounded-lg p-1.5 text-kira-midgray hover:text-kira-black"
            onClick={handleDismiss}
            type="button"
          >
            ✕
          </button>
        </div>

        <h3 className="mt-3 font-serif text-xl text-kira-black">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">{step.description}</p>

        {step.tip ? (
          <div className="mt-3 rounded-lg bg-kira-warmgray/20 p-2.5 text-xs text-kira-darkgray">
            <span className="font-semibold text-kira-brown">Pro tip:</span> {step.tip}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-kira-warmgray/30 pt-3">
          <button
            className="text-xs text-kira-midgray hover:text-kira-black underline"
            onClick={handleDismiss}
            type="button"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <Button className="px-3 py-1.5 text-xs" onClick={handlePrev} variant="secondary">
                Back
              </Button>
            ) : null}
            <Button className="px-3 py-1.5 text-xs" onClick={handleNext} variant="primary">
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
