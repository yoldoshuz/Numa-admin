"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { DataPagination } from "@/components/shared/DataPagination";
import { useOrders, type OrdersFilters } from "@/hooks/use-orders";
import { formatDate, formatPrice } from "@/lib/format";
import { STORES } from "@/lib/constants";
import type { OrderStatus, PaymentStatus, StoreSlug } from "@/lib/types";

interface OrdersPageProps {
  basePath: string;
  showStoreFilter?: boolean;
}

export const OrdersPage = ({ basePath, showStoreFilter = false }: OrdersPageProps) => {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters: OrdersFilters = {
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    store: showStoreFilter && store !== "all" ? store : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useOrders(filters);

  const filteredOrders = (data?.orders ?? []).filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.customerName?.toLowerCase().includes(s) ||
      o.customerSurname?.toLowerCase().includes(s) ||
      o.customerPhone?.includes(s) ||
      o.id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Заказы" description="Все заказы клиентов с фильтрами и поиском" />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, телефону, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as OrderStatus | "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="processing">В обработке</SelectItem>
              <SelectItem value="completed">Завершённые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v as PaymentStatus | "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Оплата" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любая оплата</SelectItem>
              <SelectItem value="unpaid">Не оплачен</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="paid">Оплачен</SelectItem>
              <SelectItem value="failed">Ошибка</SelectItem>
              <SelectItem value="refunded">Возврат</SelectItem>
            </SelectContent>
          </Select>
          {showStoreFilter && (
            <Select value={store} onValueChange={(v) => { setStore(v as StoreSlug | "all"); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Магазин" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все магазины</SelectItem>
                {STORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !filteredOrders.length ? (
        <Empty
          icon={<ShoppingCart className="size-5" />}
          title="Заказы не найдены"
          description="Попробуйте снять фильтры или изменить поиск"
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Контакт</TableHead>
                    {showStoreFilter && <TableHead>Магазин</TableHead>}
                    <TableHead>Статус</TableHead>
                    <TableHead>Оплата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`${basePath}/orders/${o.id}`} className="flex flex-col">
                          <span className="font-medium">
                            {o.customerName} {o.customerSurname}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{o.id.slice(0, 8)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {o.customerPhone && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3" />
                            {o.customerPhone}
                          </span>
                        )}
                      </TableCell>
                      {showStoreFilter && (
                        <TableCell><StoreBadge store={o.store} /></TableCell>
                      )}
                      <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                      <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                      <TableCell className="font-medium">{formatPrice(o.totalAmount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {data && <DataPagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </>
      )}
    </div>
  );
};
