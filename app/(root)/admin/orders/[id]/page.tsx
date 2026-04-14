import type { Metadata } from "next";
import { OrderDetailPage } from "@/components/pages/shared/OrderDetailPage";

export const metadata: Metadata = { title: "Детали заказа" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <OrderDetailPage basePath="/admin" orderId={id} />;
}
