import type { Metadata } from "next";
import { BlogFormPage } from "@/components/pages/shared/BlogFormPage";

export const metadata: Metadata = { title: "Новый пост" };

export default function Page() {
  return <BlogFormPage basePath="/admin" />;
}
