import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { normalizeAdmin } from "./format";
import { Admin, StoreSlug } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
};

export const normalizeAdminResponse = (admin: Admin): Admin => {
  return normalizeAdmin(
    admin as unknown as Admin & { storeSlug?: StoreSlug | null }
  );
};