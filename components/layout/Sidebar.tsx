"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Sparkles, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { useAuthStore } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  permission?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  brand: { title: string; subtitle: string };
}

export const Sidebar = ({ groups, brand }: SidebarProps) => {
  const pathname = usePathname();
  const admin = useAuthStore((s) => s.admin);
  const logout = useLogout();

  const initials = admin?.name
    ? admin.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-4" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">{brand.title}</span>
          <span className="text-[11px] text-muted-foreground">{brand.subtitle}</span>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {groups.map((group, gi) => (
            <div key={gi} className={cn("flex flex-col gap-0.5", gi > 0 && "mt-5")}>
              {group.label && (
                <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground/70 group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md p-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{admin?.name}</p>
            <StoreBadge store={admin?.store} className="mt-0.5 h-4 text-[10px] px-1.5" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
