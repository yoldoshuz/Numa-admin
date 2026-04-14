"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type { ApiSuccess, PaymentProvider, PaymentTransaction, StoreSlug } from "@/lib/types";

export interface PaymentFilters {
  store?: StoreSlug;
  provider?: PaymentProvider;
  status?: "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

interface PaymentsList {
  payments: PaymentTransaction[];
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

export const usePayments = (filters: PaymentFilters = {}) =>
  useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<PaymentsList>>("/payment/cms/transactions", {
        params: filters,
      });
      return data.data;
    },
  });

export const usePayment = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.payments.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<PaymentTransaction>>(
        `/payment/cms/transactions/${id}`
      );
      return data.data;
    },
  });

export const useClickStatus = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get<ApiSuccess<unknown>>(`/payment/cms/transactions/${id}/click-status`);
      return data.data;
    },
    onSuccess: () => toast.success("Статус Click обновлён"),
    onError: (e) => toast.error(extractError(e)),
  });

export const useReversePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiSuccess<unknown>>(
        `/payment/cms/transactions/${id}/reversal`
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      toast.success("Платёж возвращён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
