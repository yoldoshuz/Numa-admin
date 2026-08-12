"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type {
  ApiSuccess,
  Consultation,
  ConsultationsList,
  ConsultationStatus,
  StoreSlug,
} from "@/lib/types";

export interface ConsultationsFilters {
  store?: StoreSlug;
  status?: ConsultationStatus;
  /** Matched against any part of the number, case-insensitively. */
  phone?: string;
  page?: number;
  limit?: number;
}

/** Requires `users:read` — `enabled` is how the caller says the admin has it. */
export const useConsultations = (filters: ConsultationsFilters = {}, enabled = true) =>
  useQuery({
    queryKey: queryKeys.consultations.list(filters),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ConsultationsList>>(
        "/admin/consultations",
        { params: filters },
      );
      return data.data;
    },
  });

interface ConsultationUpdate {
  id: string;
  status?: ConsultationStatus;
  /** `null` clears the comment; omitted leaves it untouched. */
  managerComment?: string | null;
}

/**
 * Requires `users:write`. The API refuses a patch that carries neither field,
 * so the caller must send at least one.
 */
export const useUpdateConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: ConsultationUpdate) => {
      const { data } = await api.patch<ApiSuccess<Consultation>>(
        `/admin/consultations/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.consultations.all });
      toast.success("Заявка обновлена");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
