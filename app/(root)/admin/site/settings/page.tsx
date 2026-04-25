"use client";

import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { SiteSettingsPage } from "@/components/pages/shared/SiteSettingsPage";
import type { StoreSlug } from "@/lib/types";

export default function Page() {
  const params = useSearchParams();
  const admin = useAuthStore((s) => s.admin);
  const queryStore = (params.get("store") as StoreSlug | null) ?? null;
  const store: StoreSlug =
    queryStore ?? ((admin?.store as StoreSlug | null) ?? "nutrition");
  return <SiteSettingsPage basePath="/admin" store={store} />;
}
