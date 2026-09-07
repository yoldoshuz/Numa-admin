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
  Globe,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
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
      {
        label: "Консультации",
        href: "/admin/consultations",
        icon: MessageSquareText,
        permission: "users:read",
      },
      /*
       * Its own section, next to consultations but never merged into them: a
       * callback carries a number and nothing else, so it would arrive in the
       * consultation list as a blank card and make that list useless.
       */
      {
        label: "Обратный звонок",
        href: "/admin/support-requests",
        icon: PhoneCall,
        permission: "users:read",
      },
    ],
  },
  {
    label: "Контент",
    items: [
      { label: "Блог", href: "/admin/blog", icon: Newspaper, permission: "blog:read" },
      { label: "Сайт", href: "/admin/site", icon: Globe, permission: "site:manage" },
      { label: "Отзывы", href: "/admin/reviews", icon: MessagesSquare, permission: "site:manage" },
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
      {
        label: "Консультации",
        href: "/super-admin/consultations",
        icon: MessageSquareText,
        permission: "users:read",
      },
      {
        label: "Обратный звонок",
        href: "/super-admin/support-requests",
        icon: PhoneCall,
        permission: "users:read",
      },
    ],
  },
  {
    label: "Контент",
    items: [
      { label: "Блог", href: "/super-admin/blog", icon: Newspaper },
      { label: "Сайт", href: "/super-admin/site", icon: Globe },
      { label: "Отзывы", href: "/super-admin/reviews", icon: MessagesSquare },
    ],
  },
  {
    label: "Аккаунт",
    items: [
      { label: "Профиль", href: "/super-admin/profile", icon: UserCircle },
    ],
  },
];
