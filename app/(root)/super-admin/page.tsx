import type { Metadata } from "next";
import { SuperDashboard } from "@/components/pages/super-admin/SuperDashboard";

export const metadata: Metadata = { title: "Super Admin · Дашборд" };

export default function Page() {
  return <SuperDashboard />;
}
