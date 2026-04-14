import type { Metadata } from "next";
import { ProductsPage } from "@/components/pages/shared/ProductsPage";

export const metadata: Metadata = { title: "Продукты (все магазины)" };

export default function Page() {
  return <ProductsPage basePath="/super-admin" showStoreFilter />;
}
