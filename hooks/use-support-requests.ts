"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  ConsultationStatus,
  StoreSlug,
  SupportRequest,
  SupportRequestsList,
} from "@/lib/types";

export interface SupportRequestsFilters {
  store?: StoreSlug;
  status?: ConsultationStatus;
  /** Matched against any part of the number, case-insensitively. */
  phone?: string;
  page?: number;
  /** Capped at 100 by the API. */
  limit?: number;
}

/** Requires `users:read` — `enabled` is how the caller says the admin has it. */
export const useSupportRequests = (
  filters: SupportRequestsFilters = {},
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.supportRequests.list(filters),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SupportRequestsList>>(
        "/admin/support-requests",
        { params: filters },
      );
      return data.data;
    },
  });

interface SupportRequestUpdate {
  id: string;
  status?: ConsultationStatus;
  /** `null` clears the comment; omitted leaves it untouched. */
  managerComment?: string | null;
}

/**
 * Requires `users:write`. The API refuses a patch that carries neither field,
 * so the caller must send at least one.
 */
export const useUpdateSupportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: SupportRequestUpdate) => {
      const { data } = await api.patch<ApiSuccess<SupportRequest>>(
        `/admin/support-requests/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.supportRequests.all });
      toast.success("Заявка обновлена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
