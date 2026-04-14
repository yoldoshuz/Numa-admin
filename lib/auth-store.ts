"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import type { Admin } from "./types";
import { TOKEN_KEY } from "./constants";

interface AuthState {
  admin: Admin | null;
  token: string | null;
  setAuth: (token: string, admin: Admin) => void;
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
      setAuth: (token, admin) => {
        Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
        set({ token, admin });
      },
      setAdmin: (admin) => set({ admin }),
      clearAuth: () => {
        Cookies.remove(TOKEN_KEY);
        set({ token: null, admin: null });
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
      partialize: (state) => ({ admin: state.admin, token: state.token }),
    }
  )
);
