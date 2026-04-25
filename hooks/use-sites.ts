"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  SectionStyle,
  SectionType,
  SitePage,
  SitePageWithSections,
  SiteSection,
  SiteSettings,
  SiteSettingsUpdate,
  StoreSlug,
} from "@/lib/types";

// ─────── Pages ───────

export const useSitePages = (store: StoreSlug | undefined) =>
  useQuery({
    queryKey: queryKeys.sites.pages(store ?? ""),
    enabled: !!store,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SitePage[]>>(`/sites/cms/${store}/pages`);
      return data.data;
    },
  });

export const useSitePage = (store: StoreSlug | undefined, slug: string | undefined) =>
  useQuery({
    queryKey: queryKeys.sites.pageBySlug(store ?? "", slug ?? ""),
    enabled: !!store && !!slug,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SitePageWithSections>>(
        `/sites/cms/${store}/pages/${slug}`
      );
      return data.data;
    },
  });

export interface CreatePagePayload {
  slug: string;
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
}

export const useCreateSitePage = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePagePayload) => {
      const { data } = await api.post<ApiSuccess<SitePage>>(
        `/sites/cms/${store}/pages`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.pages(store) });
      toast.success("Страница создана");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateSitePage = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string } & Partial<CreatePagePayload>) => {
      const { data } = await api.patch<ApiSuccess<SitePage>>(
        `/sites/cms/${store}/pages/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Страница обновлена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const usePublishSitePage = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data } = await api.patch<ApiSuccess<SitePage>>(
        `/sites/cms/${store}/pages/${id}/publish`,
        { publish }
      );
      return data.data;
    },
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success(publish ? "Страница опубликована" : "Страница снята с публикации");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteSitePage = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, slug }: { id: string; slug: string }) => {
      await api.delete(`/sites/cms/${store}/pages/${id}/${slug}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Страница удалена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

// ─────── Sections ───────

export const useSiteSections = (store: StoreSlug | undefined, pageId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.sites.sections(store ?? "", pageId ?? ""),
    enabled: !!store && !!pageId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SiteSection[]>>(
        `/sites/cms/${store}/pages/${pageId}/sections`
      );
      return data.data;
    },
  });

export interface CreateSectionPayload {
  type: SectionType;
  content: Record<string, unknown>;
  style?: SectionStyle | null;
  sortOrder?: number;
}

export const useCreateSection = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      slug,
      ...payload
    }: { pageId: string; slug: string } & CreateSectionPayload) => {
      const { data } = await api.post<ApiSuccess<SiteSection>>(
        `/sites/cms/${store}/pages/${pageId}/${slug}/sections`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Секция создана");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateSection = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slug,
      id,
      ...payload
    }: {
      slug: string;
      id: string;
      type?: SectionType;
      content?: Record<string, unknown>;
      style?: SectionStyle | null;
      isVisible?: boolean;
    }) => {
      const { data } = await api.put<ApiSuccess<SiteSection>>(
        `/sites/cms/${store}/pages/${slug}/sections/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Секция обновлена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteSection = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, id }: { slug: string; id: string }) => {
      await api.delete(`/sites/cms/${store}/pages/${slug}/sections/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Секция удалена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useReorderSections = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pageId,
      slug,
      ids,
    }: {
      pageId: string;
      slug: string;
      ids: string[];
    }) => {
      await api.patch(
        `/sites/cms/${store}/pages/${pageId}/${slug}/sections/reorder`,
        { ids }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.all });
      toast.success("Порядок обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

// ─────── Settings ───────

export const useSiteSettings = (store: StoreSlug | undefined) =>
  useQuery({
    queryKey: queryKeys.sites.settings(store ?? ""),
    enabled: !!store,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SiteSettings | null>>(
        `/sites/cms/${store}/settings`
      );
      return data.data;
    },
  });

export const useUpdateSiteSettings = (store: StoreSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SiteSettingsUpdate) => {
      const { data } = await api.patch<ApiSuccess<SiteSettings>>(
        `/sites/cms/${store}/settings`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sites.settings(store) });
      toast.success("Настройки сохранены");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

// ─────── Image upload ───────

export const useUploadSiteImage = (store: StoreSlug) =>
  useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post<ApiSuccess<{ url: string }>>(
        `/sites/cms/${store}/upload`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data.url;
    },
    onError: (e) => toast.error(extractError(e)),
  });
