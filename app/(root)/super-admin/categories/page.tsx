import type { Metadata } from "next";
import { CategoriesPage } from "@/components/pages/shared/CategoriesPage";

export const metadata: Metadata = { title: "Категории (все магазины)" };

export default function Page() {
  return <CategoriesPage showStoreSelector />;
}
