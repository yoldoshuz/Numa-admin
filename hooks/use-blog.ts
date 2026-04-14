"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  BlogPost,
  BlogPostDetail,
  BlogProductCard,
  LocalizedText,
  StoreSlug,
} from "@/lib/types";

export interface BlogFilters {
  store?: StoreSlug;
  status?: "draft" | "published" | "archived";
  tag?: string;
  limit?: number;
  offset?: number;
}

export const useBlogPosts = (filters: BlogFilters = {}) =>
  useQuery({
    queryKey: queryKeys.blog.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BlogPost[]>>("/blog/cms", { params: filters });
      return data.data;
    },
  });

export const useBlogPost = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.blog.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BlogPostDetail>>(`/blog/cms/${id}`);
      return data.data;
    },
  });

export interface CreateBlogPayload {
  title: LocalizedText;
  content: LocalizedText;
  excerpt?: LocalizedText;
  slug?: string;
  coverImageUrl?: string | null;
  store?: StoreSlug | null;
  distributeTo?: StoreSlug[];
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  seoKeywords?: string[];
  tags?: string[];
  readTimeMinutes?: number;
}

export const useCreateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBlogPayload) => {
      const { data } = await api.post<ApiSuccess<BlogPost>>("/blog/cms", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blog.all });
      toast.success("Пост создан");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<CreateBlogPayload>) => {
      const { data } = await api.patch<ApiSuccess<BlogPost>>(`/blog/cms/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.blog.all });
      qc.invalidateQueries({ queryKey: queryKeys.blog.detail(id) });
      toast.success("Пост обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/blog/cms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blog.all });
      toast.success("Пост удалён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const usePublishBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiSuccess<BlogPost>>(`/blog/cms/${id}/publish`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blog.all });
      toast.success("Пост опубликован");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useArchiveBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiSuccess<BlogPost>>(`/blog/cms/${id}/archive`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blog.all });
      toast.success("Пост в архиве");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useBlogPostProducts = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.blog.products(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BlogProductCard[]>>(`/blog/cms/${id}/products`);
      return data.data;
    },
  });
