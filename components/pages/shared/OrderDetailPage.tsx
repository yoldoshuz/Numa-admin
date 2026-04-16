"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, MapPin, Package, Phone, Truck, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { useOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { formatDate, formatPrice, getLocalized } from "@/lib/format";
import { DELIVERY_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface OrderDetailPageProps {
  basePath: string;
  orderId: string;
}

export const OrderDetailPage = ({ basePath, orderId }: OrderDetailPageProps) => {
  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) return <Loader variant="page" label="Загрузка заказа…" />;
  if (isError || !order) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Заказ #${order.id.slice(0, 8)}`}
        description={`Создан ${formatDate(order.createdAt)}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${basePath}/orders`}>
              <ArrowLeft className="size-4" />
              К списку
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Позиции заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="flex size-11 items-center justify-center rounded-md border bg-muted">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{getLocalized(item.productName)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.productSku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                      <p className="font-medium">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="text-lg font-semibold">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Примечания</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  Платёжные попытки
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium capitalize">{p.provider}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatPrice(p.amountTiyin / 100)}
                        </span>
                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Управление</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Статус</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Оплата</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Метод</span>
                  <span className="text-sm font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Доставка</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Truck className="size-3.5 text-muted-foreground" />
                  {DELIVERY_TYPE_LABEL[order.deliveryType] ?? order.deliveryType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Магазин</span>
                <StoreBadge store={order.store} />
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Изменить статус</span>
                <Select
                  value={order.status}
                  onValueChange={(v) =>
                    updateStatus.mutate({ id: order.id, status: v as OrderStatus })
                  }
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger>
                    {updateStatus.isPending ? <Spinner className="size-4" /> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="processing">В обработке</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="size-4 text-primary" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Имя</p>
                <p className="font-medium">
                  {order.customerName} {order.customerSurname}
                </p>
              </div>
              {order.customerPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="size-4 mt-0.5 text-muted-foreground" />
                  <a href={`tel:${order.customerPhone}`} className="font-medium hover:underline">
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.customerAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 text-muted-foreground" />
                  <p className="font-medium">{order.customerAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
