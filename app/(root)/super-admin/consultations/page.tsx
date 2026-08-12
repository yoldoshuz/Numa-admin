import type { Metadata } from "next";
import { ConsultationsPage } from "@/components/pages/shared/ConsultationsPage";

export const metadata: Metadata = { title: "Консультации" };

export default function Page() {
  return <ConsultationsPage showStoreFilter />;
}
