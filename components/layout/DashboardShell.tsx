"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useMe } from "@/hooks/use-auth";
import { Loader } from "@/components/states/Loader";
import { Sidebar, type NavGroup } from "./Sidebar";
import { Header } from "./Header";

interface DashboardShellProps {
  children: ReactNode;
  groups: NavGroup[];
  brand: { title: string; subtitle: string };
  requireSuperAdmin?: boolean;
  profileHref: string;
}

export const DashboardShell = ({
  children,
  groups,
  brand,
  requireSuperAdmin = false,
  profileHref,
}: DashboardShellProps) => {
  const router = useRouter();
  const { admin, token } = useAuthStore();
  useMe();

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (!item.permission) return true;
        if (admin?.role === "super_admin") return true;
        return admin?.permissions.includes(item.permission) ?? false;
      }),
    }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (admin && requireSuperAdmin && admin.role !== "super_admin") {
      router.replace("/admin");
    }
    if (admin && !requireSuperAdmin && admin.role === "super_admin") {
      router.replace("/super-admin");
    }
  }, [admin, token, requireSuperAdmin, router]);

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader label="Загрузка…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar groups={filteredGroups} brand={brand} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header groups={filteredGroups} brand={brand} profileHref={profileHref} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
