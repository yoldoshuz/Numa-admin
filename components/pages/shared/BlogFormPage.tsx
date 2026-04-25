"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Archive, Upload, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useArchiveBlogPost,
  useUploadBlogCover,
  useBlogPostProducts,
  useAttachBlogProduct,
  useDetachBlogProduct,
} from "@/hooks/use-blog";
import { useProducts } from "@/hooks/use-products";
import { useAuthStore } from "@/lib/auth-store";
import { STORES } from "@/lib/constants";
import { formatPrice, getLocalized } from "@/lib/format";
import type { MarketplaceStoreSlug, StoreSlug } from "@/lib/types";

interface BlogFormPageProps {
  basePath: string;
  postId?: string;
}

export const BlogFormPage = ({ basePath, postId }: BlogFormPageProps) => {
  const router = useRouter();
  const admin = useAuthStore((s) => s.admin);
  const isEdit = !!postId && postId !== "new";
  const { data: post, isLoading, isError, error, refetch } = useBlogPost(isEdit ? postId : undefined);
  const create = useCreateBlogPost();
  const update = useUpdateBlogPost();
  const publish = usePublishBlogPost();
  const archive = useArchiveBlogPost();
  const uploadCover = useUploadBlogCover();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultStore: StoreSlug =
    admin?.role === "super_admin" ? "nutrition" : ((admin?.store as StoreSlug) ?? "nutrition");

  const [form, setForm] = useState({
    titleRu: "", titleUz: "", titleEn: "",
    contentRu: "", contentUz: "", contentEn: "",
    excerptRu: "", excerptUz: "", excerptEn: "",
    slug: "",
    coverImageUrl: "",
    store: defaultStore,
    tags: "",
    readTimeMinutes: 5,
  });

  useEffect(() => {
    if (post) {
      setForm({
        titleRu: post.title.ru,
        titleUz: post.title.uz,
        titleEn: post.title.en,
        contentRu: post.content.ru,
        contentUz: post.content.uz,
        contentEn: post.content.en,
        excerptRu: post.excerpt?.ru ?? "",
        excerptUz: post.excerpt?.uz ?? "",
        excerptEn: post.excerpt?.en ?? "",
        slug: post.slug,
        coverImageUrl: post.coverImageUrl ?? "",
        store: post.store,
        tags: post.tags.join(", "),
        readTimeMinutes: post.readTimeMinutes ?? 5,
      });
    }
  }, [post]);

  if (isEdit && isLoading) return <Loader variant="form" rows={6} />;
  if (isEdit && isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const handleSubmit = () => {
    const basePayload = {
      title: { ru: form.titleRu, uz: form.titleUz, en: form.titleEn },
      content: { ru: form.contentRu, uz: form.contentUz, en: form.contentEn },
      excerpt: { ru: form.excerptRu, uz: form.excerptUz, en: form.excerptEn },
      slug: form.slug || undefined,
      coverImageUrl: form.coverImageUrl || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      readTimeMinutes: form.readTimeMinutes,
    };
    if (isEdit && postId) {
      // store is immutable on PATCH per backend — exclude
      update.mutate({ id: postId, ...basePayload }, { onSuccess: () => router.push(`${basePath}/blog`) });
    } else {
      create.mutate(
        { ...basePayload, store: form.store },
        { onSuccess: (p) => router.push(`${basePath}/blog/${p.id}`) }
      );
    }
  };

  const handleCoverFile = (file: File) => {
    if (!isEdit || !postId) {
      toast.warning("Сначала сохраните пост — потом можно загрузить обложку");
      return;
    }
    uploadCover.mutate({ id: postId, file });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? `Редактирование: ${post?.title.ru}` : "Новый пост"}
        description={isEdit ? "Статус: " + (post?.status ?? "") : "Создание публикации в блоге"}
        actions={
          <div className="flex items-center gap-2">
            {isEdit && post?.status === "draft" && (
              <Button variant="outline" onClick={() => postId && publish.mutate(postId)} disabled={publish.isPending}>
                <Send className="size-4" />
                Опубликовать
              </Button>
            )}
            {isEdit && post?.status === "published" && (
              <Button variant="outline" onClick={() => postId && archive.mutate(postId)} disabled={archive.isPending}>
                <Archive className="size-4" />
                В архив
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${basePath}/blog`}>
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
            <CardHeader><CardTitle className="text-base">Контент</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="ru">
                <TabsList>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                  <TabsTrigger value="uz">UZ</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                </TabsList>
                {(["ru", "uz", "en"] as const).map((lang) => {
                  const titleKey = `title${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form;
                  const excerptKey = `excerpt${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form;
                  const contentKey = `content${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form;
                  return (
                    <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Заголовок ({lang.toUpperCase()})</Label>
                        <Input
                          value={form[titleKey] as string}
                          onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Короткое описание ({lang.toUpperCase()})</Label>
                        <Textarea rows={2}
                          value={form[excerptKey] as string}
                          onChange={(e) => setForm({ ...form, [excerptKey]: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Основной текст ({lang.toUpperCase()})</Label>
                        <Textarea rows={12}
                          value={form[contentKey] as string}
                          onChange={(e) => setForm({ ...form, [contentKey]: e.target.value })}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {isEdit && postId && post && (
            <BlogProductsPanel postId={postId} postStore={post.store} basePath={basePath} />
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Настройки</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="protein-and-muscle" />
              </div>

              <div className="space-y-2">
                <Label>Обложка</Label>
                {form.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImageUrl} alt="" className="aspect-video w-full rounded-md border object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted/50 text-xs text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
                <Input
                  placeholder="https://… или загрузите файл"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverFile(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={!isEdit || uploadCover.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadCover.isPending ? <Spinner className="size-4" /> : <Upload className="size-4" />}
                  Загрузить файл
                </Button>
                {!isEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Файл можно загрузить после сохранения поста.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Магазин</Label>
                <Select
                  value={form.store}
                  onValueChange={(v) => setForm({ ...form, store: v as StoreSlug })}
                  disabled={isEdit || admin?.role !== "super_admin"}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STORES.filter((s) => admin?.role === "super_admin" || s.value === admin?.store).map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Магазин нельзя поменять после создания.
                  </p>
                )}
                {form.store === "family" && (
                  <p className="text-[11px] text-muted-foreground">
                    Family-блог может ссылаться на товары любых магазинов.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Теги</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="nutrition, recovery" />
              </div>
              <div className="space-y-2">
                <Label>Время чтения (мин)</Label>
                <Input type="number" value={form.readTimeMinutes}
                  onChange={(e) => setForm({ ...form, readTimeMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && <Spinner className="size-4" />}
            <Save className="size-4" />
            {isEdit ? "Сохранить" : "Создать пост"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const BlogProductsPanel = ({
  postId,
  postStore,
  basePath: _basePath,
}: {
  postId: string;
  postStore: StoreSlug;
  basePath: string;
}) => {
  void _basePath;
  const { data: attached = [], isLoading } = useBlogPostProducts(postId);
  const attach = useAttachBlogProduct();
  const detach = useDetachBlogProduct();
  const [search, setSearch] = useState("");
  const [pickerStore, setPickerStore] = useState<MarketplaceStoreSlug>(
    postStore === "family" ? "nutrition" : (postStore as MarketplaceStoreSlug)
  );
  const [toDetach, setToDetach] = useState<string | null>(null);

  const products = useProducts({
    store: pickerStore,
    status: "active",
    search: search || undefined,
    limit: 10,
  });

  const attachedIds = new Set(attached.map((a) => a.productId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Привязанные продукты</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader variant="form" rows={3} />
        ) : attached.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Пока ничего не привязано
          </p>
        ) : (
          <div className="space-y-2">
            {attached.map((a) => (
              <div key={a.productId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{getLocalized(a.product.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.product.store} · {formatPrice(a.product.discountPrice ?? a.product.price)}
                    {a.note ? ` · ${a.note}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setToDetach(a.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Добавить продукт</Label>
            {postStore === "family" && (
              <Select value={pickerStore} onValueChange={(v) => setPickerStore(v as MarketplaceStoreSlug)}>
                <SelectTrigger className="ml-auto h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <Input
            placeholder="Поиск по названию или SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-72 space-y-1 overflow-auto">
            {products.data?.products.map((p) => {
              const already = attachedIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{getLocalized(p.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.store} · {formatPrice(p.discountPrice ?? p.price)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={already ? "secondary" : "outline"}
                    disabled={already || attach.isPending}
                    onClick={() =>
                      attach.mutate({
                        id: postId,
                        productId: p.id,
                        sortOrder: attached.length,
                      })
                    }
                  >
                    {already ? "Уже привязан" : <><Plus className="size-3" /> Привязать</>}
                  </Button>
                </div>
              );
            })}
            {!products.isLoading && (products.data?.products.length ?? 0) === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Ничего не найдено
              </p>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={!!toDetach}
          onOpenChange={(v) => !v && setToDetach(null)}
          title="Отвязать продукт?"
          confirmText="Отвязать"
          loading={detach.isPending}
          onConfirm={() => {
            if (!toDetach) return;
            detach.mutate({ id: postId, productId: toDetach }, { onSuccess: () => setToDetach(null) });
          }}
        />
      </CardContent>
    </Card>
  );
};
