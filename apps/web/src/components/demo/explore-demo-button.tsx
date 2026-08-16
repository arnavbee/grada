"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { apiRequest } from "@/src/lib/api-client";
import { setAuthCookies, type AuthTokens } from "@/src/lib/auth-cookie";

interface DemoSessionResponse extends AuthTokens {
  demo_company_name: string;
  is_demo: boolean;
}

interface ExploreDemoButtonProps {
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "text";
}

export function ExploreDemoButton({
  className,
  label = "Explore interactive demo",
  variant = "primary",
}: ExploreDemoButtonProps): JSX.Element {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo(): Promise<void> {
    setIsStarting(true);
    setError(null);
    try {
      const session = await apiRequest<DemoSessionResponse>("/auth/demo", { method: "POST" });
      setAuthCookies(session, true);
      window.sessionStorage.setItem("grada_demo_mode", "true");
      router.replace("/dashboard/catalog");
      router.refresh();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start the demo.");
      setIsStarting(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-2">
      <Button
        aria-describedby={error ? "demo-launch-error" : undefined}
        className={className}
        disabled={isStarting}
        onClick={() => void startDemo()}
        variant={variant}
      >
        {isStarting ? "Preparing workspace…" : label}
        {!isStarting ? (
          <span aria-hidden="true" className="ml-1">
            ↗
          </span>
        ) : null}
      </Button>
      {error ? (
        <span
          className="text-center text-sm text-red-700 dark:text-red-300"
          id="demo-launch-error"
          role="alert"
        >
          {error} Please try again.
        </span>
      ) : null}
    </span>
  );
}
