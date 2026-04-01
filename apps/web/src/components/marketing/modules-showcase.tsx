"use client";

import { useEffect, useRef, useState } from "react";

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
  const sectionRef = useRef<HTMLElement>(null);
  const hasPlayedSequenceRef = useRef(false);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) {
      return;
    }

    const previewDurationMs = 5200;
    const transitionGapMs = 280;

    const clearSequenceTimeout = (): void => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
    };

    const runSequence = (): void => {
      setIsSequenceRunning(true);
      let currentIndex = 0;

      const playNext = (): void => {
        if (currentIndex >= modules.length) {
          setActivePreviewIndex(null);
          setIsSequenceRunning(false);
          clearSequenceTimeout();
          return;
        }

        const previewIndex = currentIndex;
        setActivePreviewIndex(previewIndex);
        currentIndex += 1;

        sequenceTimeoutRef.current = setTimeout(() => {
          setActivePreviewIndex((active) => (active === previewIndex ? null : active));

          sequenceTimeoutRef.current = setTimeout(() => {
            playNext();
          }, transitionGapMs);
        }, previewDurationMs);
      };

      playNext();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting || hasPlayedSequenceRef.current) {
          return;
        }

        hasPlayedSequenceRef.current = true;
        runSequence();

        observer.disconnect();
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      clearSequenceTimeout();
      setIsSequenceRunning(false);
    };
  }, [modules.length]);

  return (
    <section className="animate-enter" ref={sectionRef} style={{ animationDelay: "180ms" }}>
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
                  autoPreviewActive={activePreviewIndex === index}
                  disableInteraction={isSequenceRunning}
                  detail={module.detail}
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
                  autoPreviewActive={activePreviewIndex === index}
                  disableInteraction={isSequenceRunning}
                  detail={module.detail}
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
                  autoPreviewActive={activePreviewIndex === index}
                  disableInteraction={isSequenceRunning}
                  index={index}
                  key={module.title}
                  title={module.title}
                />
              );
            }

            return (
              <DispatchDocumentsModuleCard
                autoPreviewActive={activePreviewIndex === index}
                barcodeAnimationSrc={barcodeAnimationSrc}
                disableInteraction={isSequenceRunning}
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
