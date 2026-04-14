"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Archive } from "lucide-react";
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
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useArchiveBlogPost,
} from "@/hooks/use-blog";
import { useAuthStore } from "@/lib/auth-store";
import { STORES } from "@/lib/constants";
import type { StoreSlug } from "@/lib/types";

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

  const [form, setForm] = useState({
    titleRu: "", titleUz: "", titleEn: "",
    contentRu: "", contentUz: "", contentEn: "",
    excerptRu: "", excerptUz: "", excerptEn: "",
    slug: "",
    coverImageUrl: "",
    store: (admin?.role === "super_admin" ? "" : (admin?.store as StoreSlug) || "") as "" | StoreSlug,
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
        store: (post.store as StoreSlug) ?? "",
        tags: post.tags.join(", "),
        readTimeMinutes: post.readTimeMinutes ?? 5,
      });
    }
  }, [post]);

  if (isEdit && isLoading) return <Loader variant="form" rows={6} />;
  if (isEdit && isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const handleSubmit = () => {
    const payload = {
      title: { ru: form.titleRu, uz: form.titleUz, en: form.titleEn },
      content: { ru: form.contentRu, uz: form.contentUz, en: form.contentEn },
      excerpt: { ru: form.excerptRu, uz: form.excerptUz, en: form.excerptEn },
      slug: form.slug || undefined,
      coverImageUrl: form.coverImageUrl || null,
      store: form.store || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      readTimeMinutes: form.readTimeMinutes,
    };
    if (isEdit && postId) {
      update.mutate({ id: postId, ...payload }, { onSuccess: () => router.push(`${basePath}/blog`) });
    } else {
      create.mutate(payload, { onSuccess: (p) => router.push(`${basePath}/blog/${p.id}`) });
    }
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
                {(["ru", "uz", "en"] as const).map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Заголовок ({lang.toUpperCase()})</Label>
                      <Input
                        value={form[`title${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form] as string}
                        onChange={(e) =>
                          setForm({ ...form, [`title${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}`]: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Короткое описание ({lang.toUpperCase()})</Label>
                      <Textarea rows={2}
                        value={form[`excerpt${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form] as string}
                        onChange={(e) =>
                          setForm({ ...form, [`excerpt${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}`]: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Основной текст ({lang.toUpperCase()})</Label>
                      <Textarea rows={12}
                        value={form[`content${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}` as keyof typeof form] as string}
                        onChange={(e) =>
                          setForm({ ...form, [`content${lang === "ru" ? "Ru" : lang === "uz" ? "Uz" : "En"}`]: e.target.value })
                        }
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
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
                <Label>Обложка (URL)</Label>
                <Input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Магазин</Label>
                <Select value={form.store || "__none"} onValueChange={(v) => setForm({ ...form, store: v === "__none" ? "" : (v as StoreSlug) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Глобально</SelectItem>
                    {STORES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
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
