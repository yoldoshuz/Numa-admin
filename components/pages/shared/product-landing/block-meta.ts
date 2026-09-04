import type { BlockField, BlockData, ProductBlockType } from "@/lib/types";

/** The three languages every text field carries. */
export const LANGUAGES = ["ru", "uz", "en"] as const;
export type BlockLanguage = (typeof LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<BlockLanguage, string> = {
  ru: "RU",
  uz: "UZ",
  en: "EN",
};

export interface Localized {
  uz: string;
  ru: string;
  en: string;
}

export const emptyLocalized = (): Localized => ({ uz: "", ru: "", en: "" });

/**
 * Field labels.
 *
 * The backend names fields in English and gives a Russian title for the block
 * type only, so the labels a moderator reads live here. An unknown name falls
 * back to itself rather than to a blank label — a new backend field then shows
 * up as `subheading` instead of disappearing.
 */
const FIELD_LABEL: Record<string, string> = {
  title: "Заголовок",
  subtitle: "Подзаголовок",
  badge: "Плашка",
  tagline: "Краткое описание",
  text: "Текст",
  description: "Описание",
  label: "Название",
  value: "Значение",
  icon: "Иконка",
  percent: "Процент",
  question: "Вопрос",
  answer: "Ответ",
  items: "Пункты",
  steps: "Шаги",
  stats: "Цифры",
};

export const fieldLabel = (name: string) => FIELD_LABEL[name] ?? name;

/** Singular caption for one row of a repeatable list. */
const ITEM_LABEL: Record<string, string> = {
  items: "Пункт",
  steps: "Шаг",
  stats: "Цифра",
};

export const itemLabel = (name: string) => ITEM_LABEL[name] ?? "Элемент";

/**
 * Block titles, used only when the backend does not send `titleRu` — it does
 * today, and reading it is what keeps a newly added type from needing a
 * release here.
 */
const BLOCK_LABEL: Record<string, string> = {
  hero: "Шапка над ценой",
  specs: "Характеристики",
  benefits: "Для чего нужен",
  how_to_use: "Как принимать",
  warnings: "Важно соблюдать",
  about: "Описание с цифрами",
  advantages: "Преимущества",
  metrics: "Шкалы эффективности",
  faq: "Частые вопросы",
};

export const blockLabel = (type: ProductBlockType | string, titleRu?: string) =>
  titleRu || BLOCK_LABEL[type] || type;

/**
 * What each block actually is, in one line.
 *
 * The type names alone do not tell a moderator much — "Описание и цифры" and
 * "Шкалы эффективности" are both "text plus numbers" until you have seen the
 * page. These say where on the page the block lands and what it looks like
 * there, so picking the right one does not require opening the site.
 */
const BLOCK_HINT: Record<string, string> = {
  hero: "Плашка, краткое описание и текст над ценой — самый верх карточки.",
  specs: "Таблица «название — значение» под кнопкой покупки. Строк сколько нужно.",
  benefits: "Сетка карточек «для чего нужен»: заголовок, текст и иконка.",
  how_to_use: "Нумерованные шаги приёма. Номера ставит сайт — просто расставьте шаги по порядку.",
  warnings: "Список правил на цветной плашке рядом с фотографиями.",
  about: "Абзац о продукте и до четырёх крупных цифр вокруг упаковки.",
  advantages: "Короткие строки с галочками под баннером.",
  metrics: "Полоски с процентами: заголовок, пояснение и число от 0 до 100.",
  faq: "Вопросы и ответы. Секции нет на сайте, пока не добавлен хотя бы один вопрос.",
};

export const blockHint = (type: ProductBlockType | string) => BLOCK_HINT[type] ?? "";

/** Fields long enough to deserve a textarea rather than a single line. */
const MULTILINE = new Set(["text", "description", "answer", "tagline"]);

export const isMultiline = (name: string) => MULTILINE.has(name);

/* ── data shaping ────────────────────────────────────────────────────────── */

export const asLocalized = (value: unknown): Localized => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      uz: typeof v.uz === "string" ? v.uz : "",
      ru: typeof v.ru === "string" ? v.ru : "",
      en: typeof v.en === "string" ? v.en : "",
    };
  }
  // A plain string can reach here from data written before the field was
  // localized; keep it as the Russian value rather than dropping it.
  return { uz: "", ru: typeof value === "string" ? value : "", en: "" };
};

export const asList = (value: unknown): BlockData[] =>
  Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as BlockData[]) : [];

/** An empty value of the right shape for one field. */
export function defaultValue(field: BlockField): unknown {
  switch (field.kind) {
    case "list":
      return [];
    case "number":
      return field.min ?? 0;
    case "icon":
      return "";
    default:
      return emptyLocalized();
  }
}

export function defaultData(fields: BlockField[] | undefined): BlockData {
  const out: BlockData = {};
  for (const field of fields ?? []) out[field.name] = defaultValue(field);
  return out;
}

/**
 * Fills in what a block is missing without touching what it has.
 *
 * The nine-block skeleton the backend creates carries empty strings, but a
 * block created before a field was added to its schema simply lacks the key —
 * and a form bound to `undefined` is an uncontrolled input that loses the first
 * character typed into it.
 */
export function normalizeData(fields: BlockField[] | undefined, data: BlockData): BlockData {
  const out: BlockData = { ...data };
  for (const field of fields ?? []) {
    const value = out[field.name];
    if (field.kind === "list") {
      out[field.name] = asList(value).map((item) => normalizeData(field.fields, item));
    } else if (field.kind === "number") {
      out[field.name] = typeof value === "number" ? value : (field.min ?? 0);
    } else if (field.kind === "icon") {
      out[field.name] = typeof value === "string" ? value : "";
    } else {
      out[field.name] = asLocalized(value);
    }
  }
  return out;
}

/** True when every localized string in the block is empty for this language. */
export function isLanguageEmpty(
  fields: BlockField[] | undefined,
  data: BlockData,
  language: BlockLanguage
): boolean {
  for (const field of fields ?? []) {
    if (field.kind === "list") {
      const rows = asList(data[field.name]);
      if (rows.some((row) => !isLanguageEmpty(field.fields, row, language))) return false;
    } else if (field.localized !== false && field.kind === "text") {
      if (asLocalized(data[field.name])[language].trim()) return false;
    }
  }
  return true;
}

/** True when a required field has no Russian value — the editing language. */
export function missingRequired(
  fields: BlockField[] | undefined,
  data: BlockData
): boolean {
  for (const field of fields ?? []) {
    if (!field.required) continue;
    if (field.kind === "text" && !asLocalized(data[field.name]).ru.trim()) return true;
    if (field.kind === "list" && asList(data[field.name]).length === 0) return true;
  }
  return false;
}
