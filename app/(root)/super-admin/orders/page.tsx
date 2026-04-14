import type { Metadata } from "next";
import { OrdersPage } from "@/components/pages/shared/OrdersPage";

export const metadata: Metadata = { title: "Заказы (все магазины)" };

export default function Page() {
  return <OrdersPage basePath="/super-admin" showStoreFilter />;
}
