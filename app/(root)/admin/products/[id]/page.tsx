import type { Metadata } from "next";
import { ProductFormPage } from "@/components/pages/shared/ProductFormPage";

export const metadata: Metadata = { title: "Редактирование продукта" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProductFormPage basePath="/admin" productId={id} />;
}
