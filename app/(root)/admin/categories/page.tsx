import type { Metadata } from "next";
import { CategoriesPage } from "@/components/pages/shared/CategoriesPage";

export const metadata: Metadata = { title: "Категории" };

export default function Page() {
  return <CategoriesPage />;
}
