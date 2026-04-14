"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, extractError } from "@/lib/axios";
import { queryKeys } from "@/lib/query-client";
import type { ApiSuccess, Order, OrderStatus, OrdersList, PaymentStatus, StoreSlug } from "@/lib/types";

export interface OrdersFilters {
  store?: StoreSlug;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
}

export const useOrders = (filters: OrdersFilters = {}) =>
  useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<OrdersList>>("/orders/cms", { params: filters });
      return data.data;
    },
  });

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order>>(`/orders/cms/${id}`);
      return data.data;
    },
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await api.patch<ApiSuccess<Order>>(`/orders/cms/${id}`, { status });
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
      toast.success("Статус заказа обновлён");
    },
    onError: (e) => toast.error(extractError(e)),
  });
};
