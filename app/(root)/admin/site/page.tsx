import type { Metadata } from "next";
import { SitePagesPage } from "@/components/pages/shared/SitePagesPage";

export const metadata: Metadata = { title: "Сайт" };

export default function Page() {
  return <SitePagesPage basePath="/admin" />;
}
