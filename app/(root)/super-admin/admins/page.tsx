import type { Metadata } from "next";
import { AdminsPage } from "@/components/pages/super-admin/AdminsPage";

export const metadata: Metadata = { title: "Администраторы" };

export default function Page() {
  return <AdminsPage />;
}
