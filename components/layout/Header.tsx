"use client";

import Link from "next/link";
import { LogOut, Menu, User as UserIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { NavGroup } from "./Sidebar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  groups: NavGroup[];
  brand: { title: string; subtitle: string };
  profileHref: string;
}

export const Header = ({ groups, brand, profileHref }: HeaderProps) => {
  const admin = useAuthStore((s) => s.admin);
  const logout = useLogout();
  const pathname = usePathname();

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-3 text-left">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{brand.title}</span>
                <span className="text-xs font-normal text-muted-foreground">{brand.subtitle}</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4rem)] p-3">
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
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                        )}
                      >
                        <Icon className={cn("size-4", active && "text-primary")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {admin && (
        <div className="hidden items-center gap-2 text-sm sm:flex">
          {admin.role === "super_admin" ? (
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Super Admin
            </Badge>
          ) : admin.store ? (
            <Badge variant="outline" className="capitalize">
              {admin.store}
            </Badge>
          ) : null}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left md:flex">
              <span className="text-xs font-medium leading-none">{admin?.name}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{admin?.email}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-medium">{admin?.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{admin?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserIcon className="size-4" />
              Профиль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
