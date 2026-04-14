import type { Metadata } from "next";
import { AdminDashboard } from "@/components/pages/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Дашборд",
  description: "Обзор магазина: заказы, продукты, продажи",
};

export default function Page() {
  return <AdminDashboard />;
}
