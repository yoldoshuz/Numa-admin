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
      /*
       * localStorage is synchronous, so this runs inside `create()` — touching
       * `useAuthStore` here would hit the temporal dead zone and throw, leaving
       * the app stuck on its loader. Only the rehydrated state is used.
       */
      onRehydrateStorage: () => (state) => {
        // A session persisted before the cookie was written has no credential
        // for axios to send; restore it from the stored token.
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
