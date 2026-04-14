"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type { Admin, ApiSuccess, StoreSlug } from "@/lib/types";

interface AdminFilters {
  store?: StoreSlug;
}

export const useAdmins = (filters: AdminFilters = {}) =>
  useQuery({
    queryKey: queryKeys.admins.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Admin[]>>("/admin", { params: filters });
      return data.data;
    },
  });

export const useAdmin = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.admins.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Admin>>(`/admin/${id}`);
      return data.data;
    },
  });

export const useAdminPermissions = () =>
  useQuery({
    queryKey: queryKeys.admins.permissions,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ permissions: string[] }>>("/admin/permissions");
      return data.data.permissions;
    },
  });

interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  storeSlug?: StoreSlug | null;
  permissions?: string[];
}

export const useCreateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAdminPayload) => {
      const { data } = await api.post<ApiSuccess<Admin>>("/admin", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Администратор создан");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; email?: string; isActive?: boolean }) => {
      const { data } = await api.patch<ApiSuccess<Admin>>(`/admin/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Данные обновлены");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateAdminPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; storeSlug?: StoreSlug | null; permissions?: string[] }) => {
      const { data } = await api.patch<ApiSuccess<Admin>>(`/admin/${id}/permissions`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Права обновлены");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useChangeAdminPassword = () =>
  useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      await api.patch(`/admin/${id}/password`, { newPassword });
    },
    onSuccess: () => toast.success("Пароль изменён"),
    onError: (e) => toast.error(extractError(e)),
  });

export const useActivateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiSuccess<Admin>>(`/admin/${id}/activate`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Администратор активирован");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeactivateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiSuccess<Admin>>(`/admin/${id}/deactivate`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Администратор деактивирован");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Администратор удалён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
