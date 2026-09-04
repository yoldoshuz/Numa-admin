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
  /**
   * Free-form JSONB the storefronts read for structural data — image sets,
   * per-locale copy, the numbers a section pairs its rows with.
   *
   * `PATCH` merges it: send only the keys you are changing, and send `null`
   * as a value to delete one. It briefly held the catalogue order too, which is
   * now `sortOrder` below — order is not a characteristic of the product, and
   * keeping it here meant an unrelated save could wipe it.
   */
  attributes: Record<string, unknown> | null;
  /**
   * Manual position in the storefront grid — lower is higher up, 0…100000.
   *
   * Its own column, so it survives any `attributes` edit and the API can sort
   * on it. Every product starts at 0, and ties fall back to `createdAt DESC`,
   * so a catalogue nobody has ordered by hand keeps the sequence it had.
   */
  sortOrder: number;
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

// ─────────────────────────────────────────────────────────────
// Product landing blocks ("Лендинг" tab of a product card)
// ─────────────────────────────────────────────────────────────

/**
 * A product page is a list of blocks — one block per landing section. The
 * storefront used to hardcode these sections, so the admin could only change a
 * name, a description, a photo and the stock; everything a customer actually
 * reads was in the frontend bundle. Now the whole page lives in the database
 * and is edited here in three languages.
 */
export type ProductBlockType =
  | "hero"
  | "specs"
  | "benefits"
  | "how_to_use"
  | "warnings"
  | "about"
  | "advantages"
  | "metrics"
  | "faq";

/** Every text field inside `data` is a `{uz, ru, en}` map. */
export type BlockData = Record<string, unknown>;

export interface ProductBlock {
  id: string;
  productId: string;
  type: ProductBlockType;
  /** Order on the page, ascending. Changed through the reorder endpoint only. */
  position: number;
  /**
   * Publication. A hidden block stays in the admin and is invisible to the
   * storefront, which is the lever for "not translated yet" — an empty `uz`
   * string is a hint, never an error.
   */
  isVisible: boolean;
  data: BlockData;
  createdAt?: string;
  updatedAt?: string;
}

export type BlockFieldKind = "text" | "number" | "icon" | "list";

/**
 * One field of a block form, as described by the backend. Forms are built from
 * these rather than from structures hardcoded here, so a new block type on the
 * backend shows up in the admin without a frontend release.
 */
export interface BlockField {
  kind: BlockFieldKind;
  name: string;
  localized?: boolean;
  required?: boolean;
  /** `number` only. */
  min?: number;
  max?: number;
  /** `list` only. */
  maxItems?: number;
  fields?: BlockField[];
}

export interface BlockTypeSchema {
  type: ProductBlockType;
  titleRu: string;
  fields: BlockField[];
}

export interface BlockLimits {
  maxBlocksPerProduct: number;
  maxItemsPerBlock: number;
  maxTextLength: number;
}

export interface BlockSchemas {
  types: BlockTypeSchema[];
  /** Icon keys the storefront can draw. Never hardcode this list. */
  icons: string[];
  limits: BlockLimits;
  languages: string[];
}
