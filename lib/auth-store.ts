"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import type { Admin } from "./types";
import { TOKEN_KEY, REFRESH_KEY } from "./constants";

interface AuthState {
  admin: Admin | null;
  token: string | null;
  refreshToken: string | null;
  /**
   * `false` until the persisted session has been read back from localStorage.
   *
   * Every render before that sees `token: null`, which is indistinguishable
   * from being logged out — so a route guard that acts on it immediately
   * bounces the user to /login and then, once the store catches up, back to the
   * dashboard root. That is the login flash on refresh, and the reason a reload
   * never stayed on the page you were looking at.
   */
  hydrated: boolean;
  setAuth: (token: string, admin: Admin, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  setAdmin: (admin: Admin) => void;
  clearAuth: () => void;
  hasPermission: (perm: string) => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      refreshToken: null,
      hydrated: false,
      setAuth: (token, admin, refreshToken) => {
        Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
        if (refreshToken) {
          Cookies.set(REFRESH_KEY, refreshToken, { expires: 7, sameSite: "lax" });
        }
        set({ token, admin, refreshToken: refreshToken ?? get().refreshToken });
      },
      setTokens: (token, refreshToken) => {
        Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
        if (refreshToken) {
          Cookies.set(REFRESH_KEY, refreshToken, { expires: 7, sameSite: "lax" });
        }
        set({ token, refreshToken: refreshToken ?? get().refreshToken });
      },
      setAdmin: (admin) => set({ admin }),
      clearAuth: () => {
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(REFRESH_KEY);
        set({ token: null, admin: null, refreshToken: null });
      },
      hasPermission: (perm) => {
        const { admin } = get();
        if (!admin) return false;
        if (admin.role === "super_admin") return true;
        return admin.permissions.includes(perm);
      },
      isSuperAdmin: () => get().admin?.role === "super_admin",
    }),
    {
      name: "numa-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      // Runs after rehydration, including the failure path — a corrupt payload
      // must still release the guards rather than hang them on a loader.
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({ hydrated: true });
        // A session written before this flag existed has no cookie for axios to
        // send, so restore it from the persisted token.
        if (state?.token) {
          Cookies.set(TOKEN_KEY, state.token, { expires: 7, sameSite: "lax" });
        }
        if (state?.refreshToken) {
          Cookies.set(REFRESH_KEY, state.refreshToken, { expires: 7, sameSite: "lax" });
        }
      },
    }
  )
);
