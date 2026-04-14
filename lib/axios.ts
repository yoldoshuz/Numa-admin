import axios, { type AxiosError } from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, TOKEN_KEY } from "./constants";
import type { ApiError } from "./types";

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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isLoginRequest = error.config?.url?.includes("/admin/login");
      if (!isLoginRequest) {
        Cookies.remove(TOKEN_KEY);
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
