"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  Review,
  ReviewInput,
  ReviewsList,
  StoreSlug,
} from "@/lib/types";

export interface ReviewsFilters {
  store?: StoreSlug;
  /** The API takes this as a string, not a boolean. */
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
}

/**
 * Requires `site:manage` — `enabled` is how the caller says the admin has it.
 *
 * A store-scoped admin gets their own store whatever they ask for: the server
 * quietly folds `store` down to the one they are assigned to.
 */
export const useReviews = (filters: ReviewsFilters = {}, enabled = true) =>
  useQuery({
    queryKey: queryKeys.reviews.list(filters),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ReviewsList>>("/admin/reviews", {
        params: filters,
      });
      return data.data;
    },
  });

export const useReview = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.reviews.detail(id),
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Review>>(`/admin/reviews/${id}`);
      return data.data;
    },
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ReviewInput) => {
      const { data } = await api.post<ApiSuccess<Review>>("/admin/reviews", body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
      toast.success("Отзыв создан");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * Partial update: only the fields sent are written.
 *
 * `store` is ignored by the API — moving a review between storefronts means
 * creating a new one. Sending `null` for `authorName`, `rating` or `videoUrl`
 * clears that field; omitting it leaves it alone.
 */
export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ReviewInput> & { id: string }) => {
      const { data } = await api.patch<ApiSuccess<Review>>(
        `/admin/reviews/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
      qc.invalidateQueries({ queryKey: queryKeys.reviews.detail(review.id) });
      toast.success("Отзыв обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};

/**
 * Deletes the record for good.
 *
 * To take a review off the storefront without losing it, patch `isActive` to
 * `false` instead — the list keeps showing it to admins either way.
 */
export const useDeleteReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/reviews/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
      toast.success("Отзыв удалён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
