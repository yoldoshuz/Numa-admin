"use client";

import Link from "next/link";
import {
  Package,
  ShoppingCart,
  FolderTree,
  CreditCard,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate, formatPrice } from "@/lib/format";

export const AdminDashboard = () => {
  const admin = useAuthStore((s) => s.admin);
  const orders = useOrders({ limit: 5, page: 1 });
  const products = useProducts({ limit: 5, page: 1 });
  const newOrders = useOrders({ status: "new", limit: 1 });
  const paidOrders = useOrders({ paymentStatus: "paid", limit: 1 });

  const stats = [
    {
      label: "Всего заказов",
      value: orders.data?.total ?? "—",
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Новые заказы",
      value: newOrders.data?.total ?? "—",
      icon: Clock,
      href: "/admin/orders?status=new",
    },
    {
      label: "Оплаченные",
      value: paidOrders.data?.total ?? "—",
      icon: CreditCard,
      href: "/admin/orders?paymentStatus=paid",
    },
    {
      label: "Продукты",
      value: products.data?.total ?? "—",
      icon: Package,
      href: "/admin/products",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Здравствуйте, ${admin?.name?.split(" ")[0] ?? "Администратор"}`}
        description={
          admin?.store
            ? `Управление магазином ${admin.store} · сегодня ${new Date().toLocaleDateString("ru-RU")}`
            : "Обзор вашего магазина"
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Последние заказы</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                Все
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.isLoading ? (
              <Loader variant="table" rows={3} />
            ) : orders.isError ? (
              <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
            ) : !orders.data?.orders.length ? (
              <Empty title="Нет заказов" description="Новые заказы появятся здесь" />
            ) : (
              <div className="divide-y">
                {orders.data.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {o.customerName} {o.customerSurname}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="w-28 text-right text-sm font-medium">
                        {formatPrice(o.totalAmount)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/admin/products" icon={Package} label="Управление продуктами" />
            <QuickLink href="/admin/categories" icon={FolderTree} label="Категории" />
            <QuickLink href="/admin/orders" icon={ShoppingCart} label="Все заказы" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QuickLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Package;
  label: string;
}) => (
  <Link
    href={href}
    className="flex items-center justify-between rounded-lg border border-transparent bg-muted/40 px-3 py-2.5 text-sm transition-all hover:border-primary/30 hover:bg-accent"
  >
    <span className="flex items-center gap-3">
      <Icon className="size-4 text-primary" />
      {label}
    </span>
    <ArrowUpRight className="size-4 text-muted-foreground" />
  </Link>
);
