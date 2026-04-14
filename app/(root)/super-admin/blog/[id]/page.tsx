import type { Metadata } from "next";
import { BlogFormPage } from "@/components/pages/shared/BlogFormPage";

export const metadata: Metadata = { title: "Редактирование поста" };

interface Props { params: Promise<{ id: string }> }

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BlogFormPage basePath="/super-admin" postId={id} />;
}
