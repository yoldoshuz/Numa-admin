import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, TOKEN_KEY, REFRESH_KEY } from "./constants";
import type { ApiError, ApiSuccess } from "./types";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = Cookies.get(REFRESH_KEY);
    if (!refreshToken) return null;

    const { data } = await axios.post<
      ApiSuccess<{ accessToken: string; refreshToken: string }>
    >(`${API_BASE_URL}/admin/refresh`, { refreshToken });

    const { accessToken, refreshToken: newRefresh } = data.data;

    Cookies.set(TOKEN_KEY, accessToken, { expires: 7, sameSite: "lax" });
    Cookies.set(REFRESH_KEY, newRefresh, { expires: 7, sameSite: "lax" });

    // Update zustand store if available
    try {
      const { useAuthStore } = await import("./auth-store");
      useAuthStore.getState().setTokens(accessToken, newRefresh);
    } catch {
      /* SSR or store not ready */
    }

    return accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/admin/login") &&
      !original.url?.includes("/admin/refresh")
    ) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh failed — clear auth and redirect
      if (typeof window !== "undefined") {
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(REFRESH_KEY);
        try {
          const { useAuthStore } = await import("./auth-store");
          useAuthStore.getState().clearAuth();
        } catch {
          /* ignore */
        }
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.message || error.message || "Произошла ошибка";
  }
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
};
