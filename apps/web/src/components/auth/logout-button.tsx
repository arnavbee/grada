"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { clearAuthCookies } from "@/src/lib/auth-cookie";

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoading(true);
    clearAuthCookies();
    router.replace("/login");
    router.refresh();
    setIsLoading(false);
  }

  return (
    <Button onClick={handleLogout} variant="text">
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
