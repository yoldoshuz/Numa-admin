import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  admins: {
    all: ["admins"] as const,
    list: (filters?: object) => ["admins", "list", filters] as const,
    detail: (id: string) => ["admins", "detail", id] as const,
    permissions: ["admins", "permissions"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (filters?: object) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    byStore: (store: string) => ["categories", "store", store] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters?: object) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: object) => ["users", "list", filters] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters?: object) => ["payments", "list", filters] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
  },
  blog: {
    all: ["blog"] as const,
    list: (filters?: object) => ["blog", "list", filters] as const,
    detail: (id: string) => ["blog", "detail", id] as const,
    products: (postId: string) => ["blog", "products", postId] as const,
  },
  sites: {
    all: ["sites"] as const,
    pages: (store: string) => ["sites", "pages", store] as const,
    pageBySlug: (store: string, slug: string) => ["sites", "page", store, slug] as const,
    sections: (store: string, pageId: string) => ["sites", "sections", store, pageId] as const,
    settings: (store: string) => ["sites", "settings", store] as const,
  },
};
