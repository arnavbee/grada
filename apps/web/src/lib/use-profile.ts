"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/src/lib/api-client";

export interface AuthProfile {
  company_name?: string | null;
  is_super_admin?: boolean;
  is_demo?: boolean;
  signup_source?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

const PROFILE_CACHE_TTL_MS = 60_000;
let profileCache: AuthProfile | null = null;
let profileCacheTimestampMs = 0;
let profileRequestInFlight: Promise<AuthProfile> | null = null;

export function getCachedProfile(): Promise<AuthProfile> {
  const nowMs = Date.now();
  if (profileCache && nowMs - profileCacheTimestampMs < PROFILE_CACHE_TTL_MS) {
    return Promise.resolve(profileCache);
  }
  if (profileRequestInFlight) {
    return profileRequestInFlight;
  }

  profileRequestInFlight = apiRequest<AuthProfile>("/auth/me")
    .then((profile) => {
      profileCache = profile;
      profileCacheTimestampMs = Date.now();
      if (typeof window !== "undefined") {
        // Keep the fast-path hint in sync so demo UI survives tab reopen.
        window.sessionStorage.setItem("grada_demo_mode", profile.is_demo ? "true" : "false");
      }
      return profile;
    })
    .finally(() => {
      profileRequestInFlight = null;
    });

  return profileRequestInFlight;
}

export function useProfile(): AuthProfile | null {
  const [profile, setProfile] = useState<AuthProfile | null>(profileCache);

  useEffect(() => {
    let mounted = true;
    getCachedProfile()
      .then((value) => {
        if (mounted) setProfile(value);
      })
      .catch(() => {
        // Leave profile null when unauthenticated; callers render fallbacks.
      });
    return () => {
      mounted = false;
    };
  }, []);

  return profile;
}

/**
 * Server-authoritative demo detection. Uses the sessionStorage hint for
 * first paint, then confirms against /auth/me so a demo session reopened
 * in a new tab still shows the demo banner and walkthrough.
 */
export function useDemoMode(): boolean {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("grada_demo_mode") === "true") {
      setIsDemo(true);
    }
    let mounted = true;
    getCachedProfile()
      .then((profile) => {
        if (mounted) setIsDemo(Boolean(profile.is_demo));
      })
      .catch(() => {
        // Unauthenticated or offline: keep the sessionStorage hint.
      });
    return () => {
      mounted = false;
    };
  }, []);

  return isDemo;
}
