import type { Metadata } from "next";
import { OrdersPage } from "@/components/pages/shared/OrdersPage";

export const metadata: Metadata = { title: "Заказы" };

export default function Page() {
  return <OrdersPage basePath="/admin" />;
}
