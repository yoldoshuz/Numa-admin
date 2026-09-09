"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  ImageSlotKey,
  ImageSlotMeta,
  LocalizedText,
  Product,
  ProductMedia,
  ProductStatus,
  ProductsList,
  StoreSlug,
} from "@/lib/types";

export interface ProductsFilters {
  store?: StoreSlug;
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "price" | "name" | "sortOrder";
  sortDir?: "asc" | "desc";
}

export const useProducts = (filters: ProductsFilters = {}) =>
  useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ProductsList>>("/products/cms", { params: filters });
      return data.data;
    },
  });

function findProductInCache(qc: QueryClient, id: string): Product | undefined {
  const queries = qc.getQueriesData<ProductsList>({ queryKey: queryKeys.products.all });
  for (const [, listData] of queries) {
    if (listData?.products) {
      const found = listData.products.find((p) => p.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

export const useProduct = (id: string | undefined) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    enabled: !!id,
    initialData: () => (id ? findProductInCache(qc, id) : undefined),
    initialDataUpdatedAt: () => {
      const queries = qc.getQueriesData<ProductsList>({ queryKey: queryKeys.products.all });
      let latest = 0;
      for (const [key] of queries) {
        const state = qc.getQueryState(key);
        if (state?.dataUpdatedAt && state.dataUpdatedAt > latest) latest = state.dataUpdatedAt;
      }
      return latest;
    },
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Product>>(`/products/cms/${id}`);
      return data.data;
    },
  });
};

export interface CreateProductPayload {
  name: LocalizedText;
  description?: LocalizedText | null;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  stock?: number;
  unit?: string;
  store: StoreSlug;
  categoryId: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  brand?: string | null;
  /** Merged server-side — send only the keys being changed. */
  attributes?: Record<string, unknown> | null;
  sortOrder?: number;
}

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const { data } = await api.post<ApiSuccess<Product>>("/products/cms", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Продукт создан");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<CreateProductPayload>) => {
      const { data } = await api.patch<ApiSuccess<Product>>(`/products/cms/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Продукт обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * Moves products in the storefront grid.
 *
 * Writes the dedicated `sortOrder` column. It used to live in
 * `attributes.order`, which was the wrong home twice over: the update endpoint
 * replaced `attributes` wholesale, so saving a position deleted the seeded
 * image and copy blobs sitting beside it, and any unrelated save deleted the
 * position right back.
 */
export const useReorderProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moves: { product: Product; order: number }[]) => {
      await Promise.all(
        moves.map(({ product, order }) =>
          api.patch(`/products/cms/${product.id}`, { sortOrder: order })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateProductStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      await api.patch(`/products/cms/${id}/status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Статус обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/cms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Продукт удалён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useRestoreProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiSuccess<Product>>(`/products/cms/${id}/restore`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Продукт восстановлен");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useAddProductMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      url: string;
      type?: "image" | "video";
      isMain?: boolean;
      sortOrder?: number;
    }) => {
      const { data } = await api.post<ApiSuccess<ProductMedia>>(`/products/cms/${id}/media`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Медиа добавлено");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUploadProductMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      files,
      isMain,
      sortOrder,
    }: {
      id: string;
      files: File[];
      isMain?: boolean;
      sortOrder?: number;
    }) => {
      const fd = new FormData();
      for (const file of files) fd.append("media", file);
      if (isMain !== undefined) fd.append("isMain", String(isMain));
      if (sortOrder !== undefined) fd.append("sortOrder", String(sortOrder));
      const { data } = await api.post<ApiSuccess<ProductMedia[] | ProductMedia>>(
        `/products/cms/${id}/media`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return Array.isArray(data.data) ? data.data : [data.data];
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Файлы загружены");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useUpdateProductMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      mediaId,
      ...payload
    }: {
      id: string;
      mediaId: string;
      sortOrder?: number;
      type?: "image" | "video";
      isMain?: boolean;
    }) => {
      const { data } = await api.patch<ApiSuccess<ProductMedia>>(
        `/products/cms/${id}/media/${mediaId}`,
        payload
      );
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Медиа обновлено");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteProductMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mediaId }: { id: string; mediaId: string }) => {
      await api.delete(`/products/cms/${id}/media/${mediaId}`);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Медиа удалено");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useSetMainMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mediaId }: { id: string; mediaId: string }) => {
      await api.patch(`/products/cms/${id}/media/${mediaId}/main`);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      toast.success("Главное изображение установлено");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/* ── image slots ─────────────────────────────────────────────────────────── */

/**
 * The reference list of slots, in the order the editor should draw them.
 *
 * Fetched rather than hardcoded on purpose: the row order is also the order of
 * the sections on the storefront page, so a slot the backend adds or reorders
 * shows up here without a frontend release. Cached for the session — it is a
 * schema, not data, and it does not change while an editor is open.
 */
export const useImageSlots = () =>
  useQuery({
    queryKey: queryKeys.products.imageSlots,
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccess<{ slots: ImageSlotMeta[] } | ImageSlotMeta[]>
      >("/products/cms/media/slots");
      // Both shapes are accepted because getting this wrong fails loudly and
      // totally: without the reference list the panel has no dropzones to draw
      // at all, and the other endpoints on this screen mix bare arrays with
      // wrapped objects already.
      const payload = data.data;
      return Array.isArray(payload) ? payload : payload.slots;
    },
    staleTime: Infinity,
  });

/**
 * Refreshes a product after its pictures moved.
 *
 * The list is refreshed too, not just the detail: filling `gallery_1` moves the
 * `isMain` flag server-side, so the thumbnail the products table shows has
 * changed as well. The prefix is spelled out rather than reusing
 * `queryKeys.products.all` on purpose — that one also covers the slot reference,
 * which is read once per session and has no reason to be re-fetched every time
 * someone drops a file.
 */
const invalidateProductImages = (qc: QueryClient, id: string) => {
  qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
  qc.invalidateQueries({ queryKey: ["products", "list"] });
};

/**
 * Fills one slot, from either a file or a CDN URL.
 *
 * The call replaces whatever was there — there is no clear-then-upload step,
 * which is what kept the old flat list from ever being in a half-saved state.
 * Filling `gallery_1` also moves the `isMain` flag, server-side.
 */
export const usePutImageSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      slot,
      file,
      url,
    }: {
      id: string;
      slot: ImageSlotKey;
      file?: File;
      url?: string;
    }) => {
      const path = `/products/cms/${id}/media/slot/${slot}`;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.put<ApiSuccess<ProductMedia>>(path, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return data.data;
      }
      const { data } = await api.put<ApiSuccess<ProductMedia>>(path, { url });
      return data.data;
    },
    onSuccess: (_, { id }) => {
      invalidateProductImages(qc, id);
      toast.success("Изображение загружено");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useClearImageSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, slot }: { id: string; slot: ImageSlotKey }) => {
      await api.delete(`/products/cms/${id}/media/slot/${slot}`);
    },
    onSuccess: (_, { id }) => {
      invalidateProductImages(qc, id);
      toast.success("Слот очищен");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * Swaps two slots' contents.
 *
 * Also the way to *move* a picture: the API accepts a swap where one side is
 * empty, so the editor's arrows need no separate code path for that case.
 */
export const useSwapImageSlots = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      from,
      to,
    }: {
      id: string;
      from: ImageSlotKey;
      to: ImageSlotKey;
    }) => {
      await api.patch(`/products/cms/${id}/media/slots/swap`, { from, to });
    },
    onSuccess: (_, { id }) => {
      invalidateProductImages(qc, id);
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
