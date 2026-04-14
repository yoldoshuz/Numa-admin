"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
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
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-4" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">{brand.title}</span>
          <span className="text-xs text-muted-foreground">{brand.subtitle}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              {group.label && (
                <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
    </aside>
  );
};
