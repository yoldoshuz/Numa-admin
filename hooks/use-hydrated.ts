"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * `true` once the persisted session has been read back from storage.
 *
 * Every render before that sees `token: null`, which is indistinguishable from
 * being logged out — a route guard acting on it bounces the user to /login and
 * then, once the store catches up, back to the dashboard root.
 *
 * The flag comes from persist's own hydration API rather than a field on the
 * store, because with synchronous storage rehydration happens inside
 * `create()`, where the store variable is not assigned yet.
 */
export const useAuthHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Sync storage has usually finished before this effect runs.
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // Covers both outcomes: a failed rehydration still finishes, so the guards
    // are released rather than waiting on a loader forever.
    const unsubscribe = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    /*
     * Last resort. Nothing below this flag is worth trapping someone on a
     * loading screen for — if hydration never reports back, fall through and
     * let the guards treat it as logged out, which at worst shows the login
     * form. Being stuck is the one outcome with no way out.
     */
    const failOpen = window.setTimeout(() => setHydrated(true), 2000);

    return () => {
      unsubscribe();
      window.clearTimeout(failOpen);
    };
  }, []);

  return hydrated;
};
