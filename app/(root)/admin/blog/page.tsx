import type { Metadata } from "next";
import { BlogPage } from "@/components/pages/shared/BlogPage";

export const metadata: Metadata = { title: "Блог" };

export default function Page() {
  return <BlogPage basePath="/admin" />;
}
