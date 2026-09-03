"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  BlockData,
  BlockSchemas,
  ProductBlock,
  ProductBlockType,
} from "@/lib/types";

/**
 * The landing-page blocks of a product card.
 *
 * `GET .../blocks` is not a plain read: a product that has no blocks yet — one
 * created before this feature existed — gets a skeleton of nine hidden blocks
 * written for it server-side and returned. That is why the editor needs no
 * "create landing" button.
 */
export const useProductBlocks = (productId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.products.blocks(productId ?? ""),
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ blocks: ProductBlock[] }>>(
        `/products/cms/${productId}/blocks`
      );
      return [...data.data.blocks].sort((a, b) => a.position - b.position);
    },
  });

/**
 * Which fields each block type has, the icon set and the limits.
 *
 * Static between backend releases, so it is cached for the whole session — and
 * read rather than duplicated here, so a new icon or a new block type reaches
 * the admin without a release of this app.
 */
export const useBlockSchemas = () =>
  useQuery({
    queryKey: queryKeys.products.blockSchemas,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BlockSchemas>>(
        "/products/cms/block-schemas"
      );
      return data.data;
    },
  });

export const useCreateProductBlock = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: ProductBlockType;
      data: BlockData;
      isVisible?: boolean;
    }) => {
      // `position` is not accepted — a new block always lands at the end and is
      // moved with the reorder endpoint.
      const { data } = await api.post<ApiSuccess<ProductBlock>>(
        `/products/cms/${productId}/blocks`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.blocks(productId) });
      toast.success("Блок добавлен");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * The autosave endpoint: one block at a time.
 *
 * `data` is replaced whole, without a deep merge — send the entire object or
 * dropping one of ten specifications would be impossible. `silent` is for the
 * debounced saves, which must not fire a toast on every keystroke pause.
 */
export const useUpdateProductBlock = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blockId,
      type,
      data,
      isVisible,
    }: {
      blockId: string;
      type: ProductBlockType;
      data?: BlockData;
      isVisible?: boolean;
      silent?: boolean;
    }) => {
      // Built field by field rather than spread, so `silent` — which is for
      // this hook, not the API — cannot leak into the request body, and so a
      // visibility toggle sends no `data` at all.
      const payload: Record<string, unknown> = { type };
      if (data !== undefined) payload.data = data;
      if (isVisible !== undefined) payload.isVisible = isVisible;

      const response = await api.patch<ApiSuccess<ProductBlock>>(
        `/products/cms/${productId}/blocks/${blockId}`,
        payload
      );
      return response.data.data;
    },
    onSuccess: (block, { silent }) => {
      // Patch the cache in place instead of refetching: a refetch mid-typing
      // would push the server's copy back into the open form.
      qc.setQueryData<ProductBlock[]>(
        queryKeys.products.blocks(productId),
        (blocks) => blocks?.map((b) => (b.id === block.id ? { ...b, ...block } : b))
      );
      if (!silent) toast.success("Блок сохранён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

export const useDeleteProductBlock = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      await api.delete(`/products/cms/${productId}/blocks/${blockId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.blocks(productId) });
      toast.success("Блок удалён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * Reorders the whole page in one transaction.
 *
 * The new order is applied to the cache first so the list moves under the
 * cursor without waiting for the round trip; a rejection (400 changes nothing
 * server-side) refetches and the optimistic order disappears.
 */
export const useReorderProductBlocks = (productId: string) => {
  const qc = useQueryClient();
  const key = queryKeys.products.blocks(productId);

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.put(`/products/cms/${productId}/blocks/reorder`, {
        order: ids.map((id, position) => ({ id, position })),
      });
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ProductBlock[]>(key);
      if (previous) {
        const byId = new Map(previous.map((b) => [b.id, b]));
        qc.setQueryData<ProductBlock[]>(
          key,
          ids
            .map((id, position) => {
              const block = byId.get(id);
              return block ? { ...block, position } : null;
            })
            .filter((b): b is ProductBlock => b !== null)
        );
      }
      return { previous };
    },
    onError: (e, _ids, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      toast.error(extractError(e));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
};
