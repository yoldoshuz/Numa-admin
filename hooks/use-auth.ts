"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/lib/auth-store";
import type { Admin, ApiSuccess, LoginResponse } from "@/lib/types";

interface LoginPayload {
  email: string;
  password: string;
}

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<ApiSuccess<LoginResponse>>("/admin/login", payload);
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.admin, data.refreshToken);
      toast.success(`Добро пожаловать, ${data.admin.name}`);
      const target = data.admin.role === "super_admin" ? "/super-admin" : "/admin";
      router.push(target);
    },
    onError: (error) => toast.error(extractError(error)),
  });
};

export const useMe = () => {
  const token = useAuthStore((s) => s.token);
  const setAdmin = useAuthStore((s) => s.setAdmin);
  return useQuery({
    queryKey: queryKeys.auth.me,
    enabled: !!token,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Admin>>("/admin/me");
      setAdmin(data.data);
      return data.data;
    },
  });
};

export const useUpdateMe = () => {
  const qc = useQueryClient();
  const setAdmin = useAuthStore((s) => s.setAdmin);
  return useMutation({
    mutationFn: async (payload: { name?: string; email?: string }) => {
      const { data } = await api.patch<ApiSuccess<Admin>>("/admin/me", payload);
      return data.data;
    },
    onSuccess: (admin) => {
      setAdmin(admin);
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Профиль обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useChangeMyPassword = () => {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.patch<ApiSuccess>("/admin/me/password", payload);
      return data;
    },
    onSuccess: () => toast.success("Пароль изменён"),
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/admin/logout");
      } catch {
        /* ignore */
      }
    },
    onSettled: () => {
      clearAuth();
      qc.clear();
      toast.success("Вы вышли из системы");
      router.push("/login");
    },
  });
};
