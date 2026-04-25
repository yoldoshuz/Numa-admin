"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Send,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useSitePage,
  useUpdateSitePage,
  usePublishSitePage,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
} from "@/hooks/use-sites";
import type {
  SectionType,
  SiteSection,
  StoreSlug,
} from "@/lib/types";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "text_block", label: "Текстовый блок" },
  { value: "features", label: "Преимущества" },
  { value: "gallery", label: "Галерея" },
  { value: "cta", label: "Call to Action" },
  { value: "faq", label: "FAQ" },
  { value: "stats", label: "Статистика" },
  { value: "team", label: "Команда" },
  { value: "reviews", label: "Отзывы" },
  { value: "custom", label: "Свободный JSON" },
];

interface SitePageEditorProps {
  basePath: string;
  store: StoreSlug;
  slug: string;
}

export const SitePageEditor = ({ basePath, store, slug }: SitePageEditorProps) => {
  const { data: page, isLoading, isError, error, refetch } = useSitePage(store, slug);
  const updatePage = useUpdateSitePage(store);
  const publishPage = usePublishSitePage(store);
  const createSection = useCreateSection(store);
  const reorder = useReorderSections(store);

  const [meta, setMeta] = useState({
    metaTitleRu: "",
    metaTitleUz: "",
    metaTitleEn: "",
    metaDescRu: "",
    metaDescUz: "",
    metaDescEn: "",
    canonicalUrl: "",
    ogImage: "",
  });

  useEffect(() => {
    if (page) {
      setMeta({
        metaTitleRu: page.metaTitle?.ru ?? "",
        metaTitleUz: page.metaTitle?.uz ?? "",
        metaTitleEn: page.metaTitle?.en ?? "",
        metaDescRu: page.metaDescription?.ru ?? "",
        metaDescUz: page.metaDescription?.uz ?? "",
        metaDescEn: page.metaDescription?.en ?? "",
        canonicalUrl: page.canonicalUrl ?? "",
        ogImage: page.ogImage ?? "",
      });
    }
  }, [page]);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState<SectionType>("hero");

  if (isLoading) return <Loader variant="form" rows={6} />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!page) return null;

  const moveSection = (index: number, dir: -1 | 1) => {
    const list = [...page.sections];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    reorder.mutate({
      pageId: page.id,
      slug: page.slug,
      ids: list.map((s) => s.id),
    });
  };

  const saveMeta = () => {
    updatePage.mutate({
      id: page.id,
      metaTitle: {
        ru: meta.metaTitleRu,
        uz: meta.metaTitleUz,
        en: meta.metaTitleEn,
      },
      metaDescription: {
        ru: meta.metaDescRu,
        uz: meta.metaDescUz,
        en: meta.metaDescEn,
      },
      canonicalUrl: meta.canonicalUrl || undefined,
      ogImage: meta.ogImage || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`/${page.slug}`}
        description={`Магазин: ${page.store}`}
        actions={
          <div className="flex items-center gap-2">
            {page.isPublished ? (
              <Button
                variant="outline"
                onClick={() => publishPage.mutate({ id: page.id, publish: false })}
                disabled={publishPage.isPending}
              >
                <EyeOff className="size-4" />
                Снять с публикации
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => publishPage.mutate({ id: page.id, publish: true })}
                disabled={publishPage.isPending}
              >
                <Send className="size-4" />
                Опубликовать
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${basePath}/site`}>
                <ArrowLeft className="size-4" />
                Назад
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Секции</CardTitle>
              <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Добавить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая секция</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Тип</Label>
                      <Select
                        value={newSectionType}
                        onValueChange={(v) => setNewSectionType(v as SectionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setSectionDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button
                      disabled={createSection.isPending}
                      onClick={() =>
                        createSection.mutate(
                          {
                            pageId: page.id,
                            slug: page.slug,
                            type: newSectionType,
                            content: defaultContentFor(newSectionType),
                          },
                          { onSuccess: () => setSectionDialogOpen(false) }
                        )
                      }
                    >
                      Создать
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {page.sections.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Секций ещё нет
                </p>
              ) : (
                page.sections.map((s, idx) => (
                  <SectionEditor
                    key={s.id}
                    section={s}
                    pageSlug={page.slug}
                    store={store}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < page.sections.length - 1}
                    onMoveUp={() => moveSection(idx, -1)}
                    onMoveDown={() => moveSection(idx, 1)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <SettingsIcon className="size-4" />
                SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="ru">
                <TabsList>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                  <TabsTrigger value="uz">UZ</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                </TabsList>
                {(["ru", "uz", "en"] as const).map((lang) => {
                  const titleKey = `metaTitle${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof meta;
                  const descKey = `metaDesc${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof meta;
                  return (
                    <TabsContent key={lang} value={lang} className="space-y-3 pt-3">
                      <div className="space-y-1">
                        <Label>Meta title ({lang.toUpperCase()})</Label>
                        <Input
                          value={meta[titleKey] as string}
                          onChange={(e) => setMeta({ ...meta, [titleKey]: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Meta description ({lang.toUpperCase()})</Label>
                        <Textarea
                          rows={3}
                          value={meta[descKey] as string}
                          onChange={(e) => setMeta({ ...meta, [descKey]: e.target.value })}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>

              <div className="space-y-1">
                <Label>OG image URL</Label>
                <Input
                  value={meta.ogImage}
                  onChange={(e) => setMeta({ ...meta, ogImage: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1">
                <Label>Canonical URL</Label>
                <Input
                  value={meta.canonicalUrl}
                  onChange={(e) => setMeta({ ...meta, canonicalUrl: e.target.value })}
                />
              </div>

              <Button className="w-full" onClick={saveMeta} disabled={updatePage.isPending}>
                {updatePage.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                Сохранить SEO
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Состояние</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус</span>
                {page.isPublished ? (
                  <Badge
                    variant="outline"
                    className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  >
                    Опубликована
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Черновик
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Секций</span>
                <span>{page.sections.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SectionEditor = ({
  section,
  pageSlug,
  store,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  section: SiteSection;
  pageSlug: string;
  store: StoreSlug;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => {
  const update = useUpdateSection(store);
  const del = useDeleteSection(store);
  const [content, setContent] = useState(JSON.stringify(section.content, null, 2));
  const [contentError, setContentError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setContent(JSON.stringify(section.content, null, 2));
    setIsVisible(section.isVisible);
  }, [section]);

  const save = () => {
    try {
      const parsed = JSON.parse(content);
      setContentError(null);
      update.mutate({
        slug: pageSlug,
        id: section.id,
        content: parsed,
        isVisible,
      });
    } catch {
      setContentError("Невалидный JSON");
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {section.type}
          </Badge>
          {!isVisible && <Badge variant="outline" className="text-muted-foreground">Скрыта</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!canMoveDown} onClick={onMoveDown}>
            <ArrowDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsVisible(!isVisible);
              update.mutate({
                slug: pageSlug,
                id: section.id,
                isVisible: !isVisible,
              });
            }}
          >
            {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setConfirmDel(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <Label className="text-xs">Содержимое (JSON)</Label>
        <Textarea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-mono text-xs"
        />
        {contentError && <p className="text-xs text-destructive">{contentError}</p>}
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={update.isPending}>
            {update.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Удалить секцию?"
        confirmText="Удалить"
        destructive
        loading={del.isPending}
        onConfirm={() => del.mutate({ slug: pageSlug, id: section.id }, { onSuccess: () => setConfirmDel(false) })}
      />
    </div>
  );
};

function defaultContentFor(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { heading: "", subheading: "", ctaText: "", ctaLink: "" };
    case "text_block":
      return { heading: "", body: "" };
    case "features":
      return { heading: "", items: [] };
    case "gallery":
      return { heading: "", images: [] };
    case "cta":
      return { heading: "", ctaText: "", ctaLink: "" };
    case "faq":
      return { heading: "", items: [] };
    case "stats":
      return { heading: "", items: [] };
    case "team":
      return { heading: "", members: [] };
    case "reviews":
      return { heading: "", items: [] };
    default:
      return {};
  }
}
