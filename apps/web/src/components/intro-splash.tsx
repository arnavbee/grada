"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SEEN_KEY = "grada-intro-seen";

/**
 * Full-screen video splash shown while the landing page loads, once per
 * browser session. The inline script below runs during HTML parse (SSR),
 * so returning visitors never see a flash of the overlay before hydration.
 */
export function IntroSplash() {
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setFading(true);
    if (fadeTimerRef.current === null) {
      fadeTimerRef.current = window.setTimeout(() => setDismissed(true), 600);
    }
  }, []);

  useEffect(() => {
    if (document.documentElement.hasAttribute("data-intro-seen")) {
      setDismissed(true);
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Private mode: still show the intro, just without persistence.
    }
    // Never hold the page hostage: dismiss even if the video stalls.
    failsafeTimerRef.current = window.setTimeout(dismiss, 4500);
    return () => {
      if (failsafeTimerRef.current !== null) window.clearTimeout(failsafeTimerRef.current);
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    };
  }, [dismiss]);

  if (dismissed) return null;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${SEEN_KEY}"))document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`,
        }}
      />
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${
          fading ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        data-intro-overlay
        onClick={dismiss}
      >
        <video
          autoPlay
          className="h-full w-full object-cover"
          muted
          onEnded={dismiss}
          onError={dismiss}
          playsInline
          preload="auto"
          src="/videos/intro.mp4"
        />
      </div>
    </>
  );
}
