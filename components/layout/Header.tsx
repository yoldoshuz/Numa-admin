"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, User as UserIcon, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
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
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { resolvedTheme, setTheme } = useTheme();

  const initials = admin?.name
    ? admin.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 lg:hidden">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2.5 text-left">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{brand.title}</span>
                <span className="text-xs font-normal text-muted-foreground">{brand.subtitle}</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] px-3 py-4">
            <nav className="flex flex-col gap-1">
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
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

      {/* Role badge */}
      {admin?.role === "super_admin" && (
        <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex">
          Super Admin
        </Badge>
      )}

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Переключить тему</span>
      </Button>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left md:flex">
              <span className="text-xs font-semibold leading-none">{admin?.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{admin?.email}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{admin?.name}</span>
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
