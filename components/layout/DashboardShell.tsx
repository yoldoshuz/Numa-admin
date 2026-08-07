"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useMe } from "@/hooks/use-auth";
import { Loader } from "@/components/states/Loader";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { admin, token, hydrated } = useAuthStore();
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
    // Acting before the persisted session is read would treat every reload as
    // a logout.
    if (!hydrated) return;

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
  }, [admin, token, hydrated, requireSuperAdmin, router]);

  // Reading the persisted session takes a frame or two. Dropping the whole
  // screen to a spinner for that makes every refresh feel like a cold start, so
  // the chrome renders immediately and only the content area is a skeleton.
  if (!hydrated || !admin) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-border bg-sidebar p-4 lg:flex">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="mt-4 flex flex-col gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
            <Skeleton className="size-8 rounded-md lg:hidden" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="ml-auto size-9 rounded-full" />
          </div>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Loader variant="table" />
            </div>
          </main>
        </div>
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
