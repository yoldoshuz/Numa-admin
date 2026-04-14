import type { Metadata } from "next";
import { BlogPage } from "@/components/pages/shared/BlogPage";

export const metadata: Metadata = { title: "Блог (все магазины)" };

export default function Page() {
  return <BlogPage basePath="/super-admin" showStoreFilter />;
}
