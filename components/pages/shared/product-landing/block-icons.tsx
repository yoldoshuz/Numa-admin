import {
  Activity,
  BedDouble,
  Bone,
  Brain,
  Check,
  Circle,
  Droplet,
  Eye,
  FlaskConical,
  Heart,
  Leaf,
  Moon,
  PersonStanding,
  Pill,
  Shield,
  ShieldCheck,
  Soup,
  Sparkles,
  Star,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Glyphs for the icon keys the storefront can draw.
 *
 * Blocks carry an icon *key*, never an upload, and the picker's options come
 * from `GET /products/cms/block-schemas` — this map only decides what the
 * moderator sees next to a key. A key with no glyph here still picks fine and
 * shows a neutral dot, so a new icon on the backend never blocks the admin.
 */
const GLYPH: Record<string, LucideIcon> = {
  shield: Shield,
  heart: Heart,
  brain: Brain,
  leaf: Leaf,
  drop: Droplet,
  sun: Sun,
  moon: Moon,
  bone: Bone,
  energy: Zap,
  immunity: ShieldCheck,
  metabolism: Activity,
  hormone: FlaskConical,
  vitamin: Pill,
  sleep: BedDouble,
  digestion: Soup,
  eye: Eye,
  joint: PersonStanding,
  skin: Sparkles,
  star: Star,
  check: Check,
};

/** Russian captions for the same keys, for the picker's tooltips. */
const CAPTION: Record<string, string> = {
  shield: "Защита",
  heart: "Сердце",
  brain: "Мозг",
  leaf: "Натуральность",
  drop: "Капля",
  sun: "Солнце",
  moon: "Ночь",
  bone: "Кости",
  energy: "Энергия",
  immunity: "Иммунитет",
  metabolism: "Метаболизм",
  hormone: "Гормоны",
  vitamin: "Витамины",
  sleep: "Сон",
  digestion: "Пищеварение",
  eye: "Зрение",
  joint: "Суставы",
  skin: "Кожа",
  star: "Звезда",
  check: "Галочка",
};

export const iconCaption = (key: string) => CAPTION[key] ?? key;

export const BlockIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const Glyph = GLYPH[name] ?? Circle;
  return <Glyph className={className} aria-hidden />;
};
