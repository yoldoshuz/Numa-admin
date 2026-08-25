import type { Metadata } from "next";
import { ReviewsPage } from "@/components/pages/shared/ReviewsPage";

export const metadata: Metadata = { title: "Отзывы" };

export default function Page() {
  return <ReviewsPage showStoreFilter />;
}
