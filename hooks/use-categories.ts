"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type { ApiSuccess, Category, LocalizedText, StoreSlug } from "@/lib/types";

export const useCategoriesByStore = (store: StoreSlug | undefined) =>
  useQuery({
    queryKey: queryKeys.categories.byStore(store ?? ""),
    enabled: !!store,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/categories/${store}`);
      return data.data;
    },
  });

export const useCategory = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.categories.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category>>(`/categories/id/${id}`);
      return data.data;
    },
  });

interface CreateCategoryPayload {
  name: LocalizedText;
  slug: string;
  store: StoreSlug;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const { data } = await api.post<ApiSuccess<Category>>("/categories", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Категория создана");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<CreateCategoryPayload>) => {
      const { data } = await api.patch<ApiSuccess<Category>>(`/categories/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Категория обновлена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Категория удалена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
