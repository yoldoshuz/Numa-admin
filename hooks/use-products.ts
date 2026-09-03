"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
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
  sortBy?: "createdAt" | "price" | "name";
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
  attributes?: Record<string, unknown> | null;
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
 * Whether this product's `attributes` can be written back without losing data.
 *
 * `PATCH /products/cms/:id` **replaces** `attributes` rather than merging, and
 * its validator only accepts flat scalars — a payload carrying the seeded
 * `images`, `content`, `meters` or `*Keys` is rejected with 422, and a payload
 * without them silently deletes them. So a product whose attributes are all
 * scalars can be written losslessly, and one carrying a nested value cannot be
 * written at all.
 *
 * Ordering lives in `attributes.order` because the products table has no sort
 * column. Until the backend either merges `attributes` or grows a real
 * `sortOrder` field, the storefronts keep sorting by the numbers already in the
 * database (and by their bundled catalogue where those are absent), and this
 * screen shows the order without offering to change it.
 */
export const canWriteAttributes = (
  attributes: Record<string, unknown> | null | undefined
): boolean =>
  Object.values(attributes ?? {}).every(
    (value) =>
      value === null ||
      value === undefined ||
      ["string", "number", "boolean"].includes(typeof value)
  );

/**
 * Moves a product in the storefront grid.
 *
 * Refuses any product the write would damage rather than reordering some of the
 * row and corrupting the rest — see `canWriteAttributes`.
 */
export const useReorderProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moves: { product: Product; order: number }[]) => {
      const unsafe = moves.filter(({ product }) => !canWriteAttributes(product.attributes));
      if (unsafe.length) {
        throw new Error(
          `Порядок нельзя сохранить: у ${unsafe
            .map((m) => m.product.slug)
            .join(", ")} есть вложенные attributes, а API их не принимает и затирает. Нужна доработка бэкенда.`
        );
      }

      await Promise.all(
        moves.map(({ product, order }) =>
          api.patch(`/products/cms/${product.id}`, {
            attributes: { ...(product.attributes ?? {}), order },
          })
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
