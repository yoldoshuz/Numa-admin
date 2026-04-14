import type { Metadata } from "next";
import { ProductsPage } from "@/components/pages/shared/ProductsPage";

export const metadata: Metadata = { title: "Продукты" };

export default function Page() {
  return <ProductsPage basePath="/admin" />;
}
