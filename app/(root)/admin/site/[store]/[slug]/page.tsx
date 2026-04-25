import type { Metadata } from "next";
import { SitePageEditor } from "@/components/pages/shared/SitePageEditor";
import type { StoreSlug } from "@/lib/types";

export const metadata: Metadata = { title: "Страница сайта" };

interface Props {
  params: Promise<{ store: StoreSlug; slug: string }>;
}

export default async function Page({ params }: Props) {
  const { store, slug } = await params;
  return <SitePageEditor basePath="/admin" store={store} slug={slug} />;
}
