"use client";

import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  Users,
  UserCog,
  Newspaper,
  UserCircle,
} from "lucide-react";
import type { NavGroup } from "./Sidebar";

export const adminNav: NavGroup[] = [
  {
    label: "Основное",
    items: [
      { label: "Дашборд", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Каталог",
    items: [
      { label: "Продукты", href: "/admin/products", icon: Package, permission: "products:read" },
      { label: "Категории", href: "/admin/categories", icon: FolderTree, permission: "categories:read" },
    ],
  },
  {
    label: "Продажи",
    items: [
      { label: "Заказы", href: "/admin/orders", icon: ShoppingCart, permission: "orders:read" },
    ],
  },
  {
    label: "Контент",
    items: [
      { label: "Блог", href: "/admin/blog", icon: Newspaper, permission: "blog:read" },
    ],
  },
  {
    label: "Аккаунт",
    items: [
      { label: "Профиль", href: "/admin/profile", icon: UserCircle },
    ],
  },
];

export const superAdminNav: NavGroup[] = [
  {
    label: "Обзор",
    items: [
      { label: "Дашборд", href: "/super-admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Управление",
    items: [
      { label: "Администраторы", href: "/super-admin/admins", icon: UserCog },
      { label: "Клиенты", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    label: "Каталог",
    items: [
      { label: "Продукты", href: "/super-admin/products", icon: Package },
      { label: "Категории", href: "/super-admin/categories", icon: FolderTree },
    ],
  },
  {
    label: "Продажи",
    items: [
      { label: "Заказы", href: "/super-admin/orders", icon: ShoppingCart },
      { label: "Платежи", href: "/super-admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Контент",
    items: [
      { label: "Блог", href: "/super-admin/blog", icon: Newspaper },
    ],
  },
  {
    label: "Аккаунт",
    items: [
      { label: "Профиль", href: "/super-admin/profile", icon: UserCircle },
    ],
  },
];
