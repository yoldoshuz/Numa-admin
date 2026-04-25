"use client";

import { useSearchParams } from "next/navigation";
import { SiteSettingsPage } from "@/components/pages/shared/SiteSettingsPage";
import type { StoreSlug } from "@/lib/types";

export default function Page() {
  const params = useSearchParams();
  const store: StoreSlug = (params.get("store") as StoreSlug | null) ?? "nutrition";
  return <SiteSettingsPage basePath="/super-admin" store={store} />;
}
