import type { Metadata } from "next";
import { SupportRequestsPage } from "@/components/pages/shared/SupportRequestsPage";

export const metadata: Metadata = { title: "Обратный звонок" };

export default function Page() {
  return <SupportRequestsPage />;
}
