"use client";

import { useEffect, useState } from "react";

import { Card } from "@/src/components/ui/card";
import { DispatchDocumentsModuleCard } from "@/src/components/marketing/dispatch-documents-module-card";
import { MarketplaceExportsModuleCard } from "@/src/components/marketing/marketplace-exports-module-card";
import { ReceivedPoProcessingModuleCard } from "@/src/components/marketing/received-po-processing-module-card";
import { SectionEyebrow } from "@/src/components/marketing/section-eyebrow";
import { SmartCatalogModuleCard } from "@/src/components/marketing/smart-catalog-module-card";

interface ModuleItem {
  detail: string;
  title: string;
}

interface ModulesShowcaseProps {
  barcodeAnimationSrc: string;
  commercialInvoicesAnimationSrc: string;
  marketplaceExportsAnimationSrc: string;
  modules: ModuleItem[];
  modulePrinciples: string[];
  receivedPoProcessingAnimationSrc: string;
  smartCatalogAnimationSrc: string;
}

export function ModulesShowcase({
  barcodeAnimationSrc,
  commercialInvoicesAnimationSrc,
  marketplaceExportsAnimationSrc,
  modules,
  modulePrinciples,
  receivedPoProcessingAnimationSrc,
  smartCatalogAnimationSrc,
}: ModulesShowcaseProps): JSX.Element {
  const [interactionReady, setInteractionReady] = useState(false);

  useEffect(() => {
    const onIdle = (): void => setInteractionReady(true);
    const requestIdle = window.requestIdleCallback;
    const cancelIdle = window.cancelIdleCallback;

    if (requestIdle) {
      const idleId = requestIdle(onIdle, { timeout: 1800 });
      return () => cancelIdle?.(idleId);
    }

    const timeoutId = window.setTimeout(onIdle, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <section className="animate-enter" style={{ animationDelay: "180ms" }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow linePosition="before">Modules</SectionEyebrow>
          <h2 className="mt-3 text-3xl">The product is already shaped around the real ops flow.</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-kira-darkgray">
          Four modules. One connected operating flow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modules.map((module, index) => {
            if (module.title === "Smart Catalog") {
              return (
                <SmartCatalogModuleCard
                  animationSrc={smartCatalogAnimationSrc}
                  detail={module.detail}
                  disableInteraction={!interactionReady}
                  index={index}
                  key={module.title}
                  title={module.title}
                />
              );
            }

            if (module.title === "Marketplace Exports") {
              return (
                <MarketplaceExportsModuleCard
                  animationSrc={marketplaceExportsAnimationSrc}
                  detail={module.detail}
                  disableInteraction={!interactionReady}
                  index={index}
                  key={module.title}
                  title={module.title}
                />
              );
            }

            if (module.title === "Received PO Processing") {
              return (
                <ReceivedPoProcessingModuleCard
                  animationSrc={receivedPoProcessingAnimationSrc}
                  disableInteraction={!interactionReady}
                  index={index}
                  key={module.title}
                  title={module.title}
                />
              );
            }

            return (
              <DispatchDocumentsModuleCard
                barcodeAnimationSrc={barcodeAnimationSrc}
                disableInteraction={!interactionReady}
                index={index}
                invoiceAnimationSrc={commercialInvoicesAnimationSrc}
                key={module.title}
                title={module.title}
              />
            );
          })}
        </div>

        <Card
          className="animate-enter kira-tint-mixed rounded-[32px] border-kira-darkgray/15 p-6 md:p-7"
          style={{ animationDelay: "240ms" }}
        >
          <SectionEyebrow linePosition="after">Why This Feels Different</SectionEyebrow>
          <h3 className="mt-4 text-3xl leading-tight">Built like one operating system.</h3>
          <div className="mt-6 space-y-3">
            {modulePrinciples.map((principle, index) => (
              <div
                className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/55 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                key={principle}
              >
                <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                  Principle {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-kira-darkgray">{principle}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
