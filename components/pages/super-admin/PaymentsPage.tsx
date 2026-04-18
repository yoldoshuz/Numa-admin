"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Eye, RefreshCcw, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { DataPagination } from "@/components/shared/DataPagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  usePayments,
  useClickStatus,
  useReversePayment,
  type PaymentFilters,
} from "@/hooks/use-payments";
import { formatDate, formatTiyin } from "@/lib/format";
import { MARKETPLACE_STORES } from "@/lib/constants";
import type { PaymentProvider, PaymentTransaction, StoreSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  paid: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  cancelled: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  expired: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  refunded: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Оплачен",
  pending: "Ожидает",
  failed: "Ошибка",
  cancelled: "Отменён",
  expired: "Истёк",
  refunded: "Возврат",
};

export const PaymentsPage = () => {
  const [page, setPage] = useState(1);
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [provider, setProvider] = useState<PaymentProvider | "all">("all");
  const [status, setStatus] = useState<PaymentFilters["status"] | "all">("all");

  const limit = 20;
  const { data, isLoading, isError, error, refetch } = usePayments({
    store: store === "all" ? undefined : store,
    provider: provider === "all" ? undefined : provider,
    status: status === "all" ? undefined : status,
    limit,
    offset: (page - 1) * limit,
  });

  const clickStatus = useClickStatus();
  const reverse = useReversePayment();
  const [toReverse, setToReverse] = useState<PaymentTransaction | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Платежи" description="Все платёжные транзакции: Click и Payme" />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={store} onValueChange={(v) => { setStore(v as StoreSlug | "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Магазин" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все магазины</SelectItem>
              {MARKETPLACE_STORES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={provider} onValueChange={(v) => { setProvider(v as PaymentProvider | "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Провайдер" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все провайдеры</SelectItem>
              <SelectItem value="click">Click</SelectItem>
              <SelectItem value="payme">Payme</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status ?? "all"} onValueChange={(v) => { setStatus(v === "all" ? "all" : (v as PaymentFilters["status"])); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="paid">Оплачен</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="failed">Ошибка</SelectItem>
              <SelectItem value="cancelled">Отменён</SelectItem>
              <SelectItem value="expired">Истёк</SelectItem>
              <SelectItem value="refunded">Возврат</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.payments.length ? (
        <Empty icon={<CreditCard className="size-5" />} title="Транзакции не найдены" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Транзакция</TableHead>
                    <TableHead>Заказ / Клиент</TableHead>
                    <TableHead>Магазин</TableHead>
                    <TableHead>Провайдер</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono">#{p.id.slice(0, 8)}</span>
                          {p.providerTransactionId && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {p.providerTransactionId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.order ? (
                          <Link
                            href={`/super-admin/orders/${p.order.id}`}
                            className="flex flex-col hover:underline"
                          >
                            <span className="text-sm font-medium">{p.order.customerName}</span>
                            <span className="text-xs text-muted-foreground">{p.order.customerPhone}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StoreBadge store={p.store} /></TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.provider}</Badge></TableCell>
                      <TableCell className="font-medium">{formatTiyin(p.amountTiyin)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-normal", STATUS_COLOR[p.status])}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.order && (
                              <DropdownMenuItem asChild>
                                <Link href={`/super-admin/orders/${p.order.id}`}>
                                  <Eye className="size-4" />
                                  К заказу
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {p.provider === "click" && (
                              <DropdownMenuItem onClick={() => clickStatus.mutate(p.id)}>
                                <RefreshCcw className="size-4" />
                                Обновить статус Click
                              </DropdownMenuItem>
                            )}
                            {p.status === "paid" && p.provider === "click" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setToReverse(p)}
                                >
                                  <Undo2 className="size-4" />
                                  Возврат платежа
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <DataPagination page={page} pages={data.pages} total={data.total} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!toReverse}
        onOpenChange={(v) => !v && setToReverse(null)}
        title="Выполнить возврат платежа?"
        description="Платёж будет возвращён через Click. Условия возвратов по правилам Click применяются."
        destructive
        confirmText="Вернуть"
        loading={reverse.isPending}
        onConfirm={() => {
          if (!toReverse) return;
          reverse.mutate(toReverse.id, { onSuccess: () => setToReverse(null) });
        }}
      />
    </div>
  );
};
