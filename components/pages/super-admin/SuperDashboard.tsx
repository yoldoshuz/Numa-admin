"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Users,
  UserCog,
  Package,
  ArrowUpRight,
  CreditCard,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useAdmins } from "@/hooks/use-admins";
import { useUsers } from "@/hooks/use-users";
import { usePayments } from "@/hooks/use-payments";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate, formatPrice } from "@/lib/format";
import { MARKETPLACE_STORES } from "@/lib/constants";

export const SuperDashboard = () => {
  const admin = useAuthStore((s) => s.admin);
  const orders = useOrders({ limit: 8, page: 1 });
  const products = useProducts({ limit: 1 });
  const admins = useAdmins();
  const users = useUsers({ limit: 1 });
  const paidPayments = usePayments({ status: "paid", limit: 1 });

  const storeStats = MARKETPLACE_STORES.map((s) => ({
    store: s.value,
    label: s.label,
    color: s.color,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Глобальный обзор, ${admin?.name?.split(" ")[0] ?? ""}`}
        description="Полный доступ ко всем магазинам и сервисам"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Всего заказов"
          value={orders.data?.total}
          icon={ShoppingCart}
          href="/super-admin/orders"
        />
        <StatCard
          label="Администраторы"
          value={admins.data?.length}
          icon={UserCog}
          href="/super-admin/admins"
        />
        <StatCard
          label="Клиенты"
          value={users.data?.total}
          icon={Users}
          href="/super-admin/users"
        />
        <StatCard
          label="Оплаченные"
          value={paidPayments.data?.total}
          icon={CreditCard}
          href="/super-admin/payments?status=paid"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {storeStats.map((s) => (
          <StoreCard key={s.store} store={s.store} label={s.label} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Последние заказы</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/super-admin/orders">
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
              <Empty title="Нет заказов" />
            ) : (
              <div className="divide-y">
                {orders.data.orders.slice(0, 6).map((o) => (
                  <Link
                    key={o.id}
                    href={`/super-admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium">
                        {o.customerName} {o.customerSurname}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <StoreBadge store={o.store} />
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <span className="w-24 text-right text-sm font-medium">
                      {formatPrice(o.totalAmount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Быстрый доступ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/super-admin/admins" icon={UserCog} label="Администраторы" />
            <QuickLink href="/super-admin/users" icon={Users} label="Клиенты" />
            <QuickLink href="/super-admin/products" icon={Package} label="Продукты" />
            <QuickLink href="/super-admin/payments" icon={CreditCard} label="Платежи" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | undefined;
  icon: typeof ShoppingCart;
  href: string;
}) => (
  <Link href={href}>
    <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value ?? "—"}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

const StoreCard = ({ store, label }: { store: "nutrition" | "kids" | "halal"; label: string }) => {
  const storeOrders = useOrders({ store, limit: 1 });
  const storeProducts = useProducts({ store, limit: 1 });
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <StoreBadge store={store} />
          <TrendingUp className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold">{label}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Заказов</p>
            <p className="font-medium">{storeOrders.data?.total ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Продуктов</p>
            <p className="font-medium">{storeProducts.data?.total ?? "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Users;
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
