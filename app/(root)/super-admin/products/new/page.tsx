import type { Metadata } from "next";
import { ProductFormPage } from "@/components/pages/shared/ProductFormPage";

export const metadata: Metadata = { title: "Новый продукт" };

export default function Page() {
  return <ProductFormPage basePath="/super-admin" />;
}
