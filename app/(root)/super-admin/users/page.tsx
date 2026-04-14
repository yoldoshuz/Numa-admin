import type { Metadata } from "next";
import { UsersPage } from "@/components/pages/super-admin/UsersPage";

export const metadata: Metadata = { title: "Клиенты" };

export default function Page() {
  return <UsersPage />;
}
