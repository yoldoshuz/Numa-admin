import type { LocalizedText } from "./types";

export const formatPrice = (v: number): string =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v) + " сум";

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export const formatDateShort = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ru-RU");
  } catch {
    return "—";
  }
};

export const getLocalized = (t: LocalizedText | null | undefined, fallback = "—"): string => {
  if (!t) return fallback;
  return t.ru || t.en || t.uz || fallback;
};

export const formatTiyin = (tiyin: number): string =>
  formatPrice(Math.round(tiyin / 100));
