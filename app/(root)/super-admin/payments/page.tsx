import type { Metadata } from "next";
import { PaymentsPage } from "@/components/pages/super-admin/PaymentsPage";

export const metadata: Metadata = { title: "Платежи" };

export default function Page() {
  return <PaymentsPage />;
}
