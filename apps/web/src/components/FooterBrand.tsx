"use client";

import { useEffect, useRef, useState } from "react";

export function FooterBrand() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Animate only once
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center py-20">
      <h2 className="text-[4rem] font-bold leading-none tracking-tighter md:text-[8rem] lg:text-[10rem]">
        Grada
        {isVisible ? (
          <span className="ml-2 mb-2 inline-block h-4 w-4 [perspective:160px] md:mb-4 md:h-8 md:w-8">
            <span className="kira-cube-dot animate-cube-dot" />
          </span>
        ) : (
          <span className="inline-block ml-2 mb-2 h-4 w-4 bg-transparent md:mb-4 md:h-8 md:w-8" />
        )}
      </h2>
    </div>
  );
}
