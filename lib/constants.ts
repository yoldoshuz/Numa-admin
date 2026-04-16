import type { StoreSlug } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://numa.yoldosh.uz/api/v1";

export const TOKEN_KEY = "numa_admin_token";
export const REFRESH_KEY = "numa_admin_refresh";

export const STORES: { value: StoreSlug; label: string; color: string }[] = [
  { value: "nutrition", label: "Nutrition", color: "bg-teal-500/10 text-teal-700 dark:text-teal-300" },
  { value: "kids", label: "Kids", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { value: "halal", label: "Halal", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
];

export const STORE_LABEL: Record<StoreSlug, string> = {
  nutrition: "Nutrition",
  kids: "Kids",
  halal: "Halal",
};

export const ORDER_STATUS_LABEL = {
  new: "Новый",
  processing: "В обработке",
  completed: "Завершён",
  cancelled: "Отменён",
} as const;

export const ORDER_STATUS_COLOR = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  processing: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  completed: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
} as const;

export const PAYMENT_STATUS_LABEL = {
  unpaid: "Не оплачен",
  pending: "Ожидает",
  paid: "Оплачен",
  failed: "Ошибка",
  expired: "Истёк",
  refunded: "Возврат",
} as const;

export const PAYMENT_STATUS_COLOR = {
  unpaid: "bg-muted text-muted-foreground border-border",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  paid: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  failed: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  expired: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  refunded: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
} as const;

export const PRODUCT_STATUS_LABEL = {
  active: "Активный",
  draft: "Черновик",
  archived: "Архив",
} as const;

export const PRODUCT_STATUS_COLOR = {
  active: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
} as const;

export const PAYMENT_METHOD_LABEL = {
  cash: "Наличные",
  click: "Click",
  payme: "Payme",
} as const;

export const DELIVERY_TYPE_LABEL = {
  delivery: "Доставка",
  pickup: "Самовывоз",
} as const;

export const DELIVERY_TYPE_COLOR = {
  delivery: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  pickup: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
} as const;

export const ALL_PERMISSIONS = [
  "products:read",
  "products:write",
  "products:delete",
  "categories:read",
  "categories:write",
  "categories:delete",
  "orders:read",
  "orders:write",
  "payments:read",
  "payments:write",
  "users:read",
  "users:write",
  "blog:read",
  "blog:write",
  "blog:delete",
  "site:manage",
];
