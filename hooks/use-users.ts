"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type { ApiSuccess, StoreSlug, User } from "@/lib/types";

export interface UsersFilters {
  isActive?: boolean;
  /**
   * Matches either side of a client's relationship with a storefront —
   * registered there or active there. Someone who signed up on nutrition and
   * bought on kids has to turn up under both, because the manager filtering by
   * "kids" is looking for that site's customers, not for rows with one
   * particular column value.
   */
  store?: StoreSlug;
  page?: number;
  limit?: number;
}

interface UsersList {
  users: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const useUsers = (filters: UsersFilters = {}) =>
  useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<UsersList>>("/admin/users", { params: filters });
      return data.data;
    },
  });

export const useUser = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<User>>(`/admin/users/${id}`);
      return data.data;
    },
  });

export const useActivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/activate`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Пользователь активирован");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/deactivate`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Пользователь деактивирован");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
