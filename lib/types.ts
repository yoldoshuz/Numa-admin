export type StoreSlug = "nutrition" | "kids" | "halal" | "family";
export type MarketplaceStoreSlug = "nutrition" | "kids" | "halal";
export type StoreKind = "marketplace" | "informational";
export type AdminRole = "super_admin" | "admin";

export interface LocalizedText {
  uz: string;
  ru: string;
  en: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  statusCode: number;
  code?: string;
  message: string;
  requestId?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  store: StoreSlug | null;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  store: StoreSlug;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories?: Category[];
}

export interface ProductMedia {
  id: string;
  url: string;
  type: "image" | "video";
  isMain: boolean;
  sortOrder: number;
}

export type ProductStatus = "active" | "draft" | "archived";

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  slug: string;
  sku: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  unit: string;
  store: StoreSlug;
  categoryId: string;
  status: ProductStatus;
  isFeatured: boolean;
  brand: string | null;
  attributes: Record<string, string | number | boolean> | null;
  media: ProductMedia[];
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductsList extends PaginationMeta {
  products: Product[];
}

export type OrderStatus = "new" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "expired" | "refunded";
export type PaymentMethod = "cash" | "click" | "payme";
export type DeliveryType = "delivery" | "pickup";
export type PaymentProvider = "click" | "payme";

export interface OrderItem {
  id: string;
  productId: string;
  productName: LocalizedText;
  productSku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  store: StoreSlug;
  provider: PaymentProvider;
  amountTiyin: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
  providerTransactionId: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  order?: {
    id: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    store: string;
  } | null;
}

export interface Order {
  id: string;
  store: StoreSlug;
  userId: string | null;
  customerName: string | null;
  customerSurname: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryType: DeliveryType;
  notes: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
  reservedUntil: string | null;
  items: OrderItem[];
  payments?: PaymentTransaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrdersList extends PaginationMeta {
  orders: Order[];
}

export interface BlogPost {
  id: string;
  title: LocalizedText;
  excerpt: LocalizedText | null;
  slug: string;
  coverImageUrl: string | null;
  store: StoreSlug;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  tags: string[];
  readTimeMinutes: number | null;
  viewCount: number;
  createdAt: string;
}

export interface BlogPostDetail extends BlogPost {
  content: LocalizedText;
  seoTitle: LocalizedText | null;
  seoDescription: LocalizedText | null;
  seoKeywords: string[];
  products: BlogProductCard[];
}

export interface BlogProductCard {
  blogPostId: string;
  productId: string;
  store: MarketplaceStoreSlug;
  note: string | null;
  sortOrder: number;
  product: {
    id: string;
    name: LocalizedText;
    price: number;
    discountPrice: number | null;
    store: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Site CMS
// ─────────────────────────────────────────────────────────────

export type SectionType =
  | "hero"
  | "text_block"
  | "features"
  | "gallery"
  | "cta"
  | "faq"
  | "stats"
  | "team"
  | "reviews"
  | "custom";

export interface SectionStyle {
  backgroundColor?: string;
  textColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  maxWidth?: string;
}

export interface SiteSection {
  id: string;
  pageId: string;
  type: SectionType;
  sortOrder: number;
  content: Record<string, unknown>;
  style?: SectionStyle | null;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SitePage {
  id: string;
  store: StoreSlug;
  slug: string;
  metaTitle?: Record<string, string> | null;
  metaDescription?: Record<string, string> | null;
  ogImage?: string | null;
  ogType?: string | null;
  canonicalUrl?: string | null;
  structuredData?: Record<string, unknown> | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SitePageWithSections extends SitePage {
  sections: SiteSection[];
}

export interface SiteBranding {
  logoUrl?: string;
  faviconUrl?: string;
  siteName?: LocalizedText;
}

export interface SiteColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface SiteTypography {
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
}

export interface SiteContact {
  phone?: string;
  email?: string;
  address?: LocalizedText;
  workingHours?: string;
}

export interface SiteSocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SiteNavChild {
  id: string;
  label: LocalizedText;
  url: string;
  target: "_self" | "_blank";
  sortOrder: number;
  isVisible: boolean;
}

export interface SiteNavItem extends SiteNavChild {
  children?: SiteNavChild[];
}

export interface SiteFooterLink {
  label: LocalizedText;
  url: string;
  target?: "_self" | "_blank";
}

export interface SiteFooterColumn {
  title: LocalizedText;
  links: SiteFooterLink[];
}

export interface SiteFooter {
  columns?: SiteFooterColumn[];
  copyright?: LocalizedText;
}

export interface SiteSettings {
  id: string;
  store: StoreSlug;
  branding?: SiteBranding;
  colors?: SiteColorPalette;
  typography?: SiteTypography;
  contact?: SiteContact;
  socialLinks?: SiteSocialLink[];
  navigation?: SiteNavItem[];
  footer?: SiteFooter;
  customHeadCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SiteSettingsUpdate = Partial<Omit<SiteSettings, "id" | "store" | "createdAt" | "updatedAt">>;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive?: boolean;
  createdAt?: string;
  orders?: Order[];
}

// ─────────────────────────────────────────────────────────────
// Consultations
// ─────────────────────────────────────────────────────────────

export type ConsultationStatus = "new" | "in_progress" | "done" | "rejected";

export interface Consultation {
  id: string;
  store: StoreSlug;
  /** Not null when the request came from a signed-in client. */
  userId: string | null;
  name: string;
  phone: string;
  /** "Тема обращения" from the form — optional, so often absent. */
  subject?: string | null;
  problem: string;
  /**
   * Resolved server-side from the request IP, never sent by the storefront.
   * Best-effort: a VPN or an unreachable geo service leaves it null, and a
   * mobile subscriber anywhere in the country resolves to Tashkent because the
   * operators' pools are registered there. Treat it as a hint, not a fact.
   */
  city?: string | null;
  country?: string | null;
  status: ConsultationStatus;
  managerComment: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Unlike orders and products, the list endpoint calls its page `items`. */
export interface ConsultationsList extends PaginationMeta {
  items: Consultation[];
}

/* ── reviews ─────────────────────────────────────────────────────────────── */

/**
 * A customer review. CMS content: there is no public submission form and no
 * moderation queue — an admin writes them and they publish immediately.
 */
export interface Review {
  id: string;
  store: StoreSlug;
  title: LocalizedText;
  description: LocalizedText;
  authorName: string | null;
  rating: number | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsList {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Create payload. All three languages are required on both text fields — the
 * API rejects a partial set rather than letting an English storefront render a
 * blank card.
 */
export interface ReviewInput {
  store: StoreSlug;
  title: LocalizedText;
  description: LocalizedText;
  authorName?: string | null;
  rating?: number | null;
  videoUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}
