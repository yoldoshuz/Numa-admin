"use client";

import { useState } from "react";
import { MessagesSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { DataPagination } from "@/components/shared/DataPagination";
import {
  useCreateReview,
  useDeleteReview,
  useReviews,
  useUpdateReview,
  type ReviewsFilters,
} from "@/hooks/use-reviews";
import { useAuthStore } from "@/lib/auth-store";
import { STORES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { LocalizedText, Review, ReviewInput, StoreSlug } from "@/lib/types";

/**
 * Uzbek first — it is the language the shops sell in, and the one a moderator
 * writing a new review reaches for.
 */
const LOCALES: { key: keyof LocalizedText; label: string; short: string }[] = [
  { key: "uz", label: "O‘zbekcha", short: "UZ" },
  { key: "ru", label: "Русский", short: "RU" },
  { key: "en", label: "English", short: "EN" },
];

const emptyText = (): LocalizedText => ({ uz: "", ru: "", en: "" });

interface Draft {
  store: StoreSlug;
  title: LocalizedText;
  description: LocalizedText;
  authorName: string;
  rating: string;
  videoUrl: string;
  sortOrder: string;
  isActive: boolean;
}

const draftFrom = (review: Review | null, fallbackStore: StoreSlug): Draft => ({
  store: review?.store ?? fallbackStore,
  title: review ? { ...review.title } : emptyText(),
  description: review ? { ...review.description } : emptyText(),
  authorName: review?.authorName ?? "",
  rating: review?.rating != null ? String(review.rating) : "",
  videoUrl: review?.videoUrl ?? "",
  sortOrder: String(review?.sortOrder ?? 0),
  isActive: review?.isActive ?? true,
});

interface ReviewsPageProps {
  /** Only the super-admin picks which storefront a review belongs to. */
  showStoreFilter?: boolean;
}

/**
 * Reviews CMS.
 *
 * These are authored, not collected: there is no public submission form and no
 * moderation queue, so anything saved here is live on the storefront as soon as
 * `isActive` is on. The storefronts keep a bundled set as a fallback and stop
 * using it the moment this list has something in it.
 */
export const ReviewsPage = ({ showStoreFilter = false }: ReviewsPageProps) => {
  const admin = useAuthStore((s) => s.admin);
  const canManage =
    admin?.role === "super_admin" ||
    (admin?.permissions.includes("site:manage") ?? false);

  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Review | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

  const filters: ReviewsFilters = {
    page,
    limit: 20,
    store: showStoreFilter && store !== "all" ? store : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useReviews(filters, canManage);
  const create = useCreateReview();
  const update = useUpdateReview();
  const remove = useDeleteReview();

  const openForm = (review: Review | null) => {
    setEditing(review);
    setDraft(draftFrom(review, admin?.store ?? "family"));
  };

  const closeForm = () => {
    setEditing(null);
    setDraft(null);
  };

  const submit = () => {
    if (!draft) return;

    /*
     * The API rejects a partial language set outright, so it is caught here
     * rather than shown as a 400 with no pointer at which field is empty.
     */
    const missing = LOCALES.filter(
      (l) => !draft.title[l.key].trim() || !draft.description[l.key].trim(),
    );
    if (missing.length) return;

    const body: ReviewInput = {
      store: draft.store,
      title: draft.title,
      description: draft.description,
      authorName: draft.authorName.trim() || null,
      rating: draft.rating ? Number(draft.rating) : null,
      videoUrl: draft.videoUrl.trim() || null,
      sortOrder: Number(draft.sortOrder) || 0,
      isActive: draft.isActive,
    };

    const done = { onSuccess: closeForm };
    if (editing) {
      // `store` is ignored by the API on update; sending it would be noise.
      const { store: _ignored, ...patch } = body;
      update.mutate({ id: editing.id, ...patch }, done);
    } else {
      create.mutate(body, done);
    }
  };

  if (!canManage) {
    return (
      <div className="space-y-5">
        <PageHeader title="Отзывы" />
        <Empty
          icon={<MessagesSquare className="size-5" />}
          title="Нет доступа"
          description="Раздел доступен администраторам с правом site:manage"
        />
      </div>
    );
  }

  const incomplete =
    draft != null &&
    LOCALES.some(
      (l) => !draft.title[l.key].trim() || !draft.description[l.key].trim(),
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Отзывы"
        description="Отзывы для витрин. Публикуются сразу — модерации нет"
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus className="size-4" />
            Добавить отзыв
          </Button>
        }
      />

      {showStoreFilter && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Select
              value={store}
              onValueChange={(v) => {
                setStore(v as StoreSlug | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Сайт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сайты</SelectItem>
                {STORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <Empty
          icon={<MessagesSquare className="size-5" />}
          title="Отзывов пока нет"
          description="Витрины показывают встроенный набор, пока здесь пусто"
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Отзыв</TableHead>
                    <TableHead>Автор</TableHead>
                    {showStoreFilter && <TableHead>Сайт</TableHead>}
                    <TableHead className="w-20">Оценка</TableHead>
                    <TableHead className="w-24">Порядок</TableHead>
                    <TableHead className="w-28">Статус</TableHead>
                    <TableHead className="w-32">Изменён</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="max-w-[380px]">
                        <p className="font-medium">{review.title.ru || review.title.uz}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {review.description.ru || review.description.uz}
                        </p>
                      </TableCell>
                      <TableCell>{review.authorName ?? "—"}</TableCell>
                      {showStoreFilter && (
                        <TableCell>
                          <StoreBadge store={review.store} />
                        </TableCell>
                      )}
                      <TableCell>{review.rating ?? "—"}</TableCell>
                      <TableCell>{review.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={review.isActive ? "default" : "secondary"}>
                          {review.isActive ? "Опубликован" : "Скрыт"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(review.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Редактировать"
                            onClick={() => openForm(review)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Удалить"
                            onClick={() => setPendingDelete(review)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <DataPagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}

      <Dialog open={draft != null} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать отзыв" : "Новый отзыв"}</DialogTitle>
            <DialogDescription>
              Заголовок и текст обязательны на всех трёх языках — витрина сама
              выбирает нужный
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-5">
              {showStoreFilter && !editing && (
                <div className="space-y-2">
                  <Label>Сайт</Label>
                  <Select
                    value={draft.store}
                    onValueChange={(v) => setDraft({ ...draft, store: v as StoreSlug })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/*
                Tabs rather than three stacked cards, matching the product form.
                Stacked, the six fields ran past the bottom of the dialog and the
                English pair was below the fold on every laptop — so a review
                saved by scrolling to the buttons was routinely missing a
                language the API requires. One language at a time fits, and the
                badge says which are still empty without opening them.
              */}
              <Tabs defaultValue={LOCALES[0].key}>
                <TabsList>
                  {LOCALES.map((locale) => {
                    const blank =
                      !draft.title[locale.key].trim() ||
                      !draft.description[locale.key].trim();
                    return (
                      <TabsTrigger key={locale.key} value={locale.key} className="gap-2">
                        {locale.label}
                        {blank && (
                          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {LOCALES.map((locale) => (
                  <TabsContent key={locale.key} value={locale.key} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${locale.key}`}>
                        Заголовок ({locale.short})
                      </Label>
                      <Input
                        id={`title-${locale.key}`}
                        value={draft.title[locale.key]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            title: { ...draft.title, [locale.key]: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`text-${locale.key}`}>Текст ({locale.short})</Label>
                      <Textarea
                        id={`text-${locale.key}`}
                        rows={5}
                        value={draft.description[locale.key]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            description: {
                              ...draft.description,
                              [locale.key]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="authorName">Автор</Label>
                  <Input
                    id="authorName"
                    value={draft.authorName}
                    placeholder="Необязательно"
                    onChange={(e) => setDraft({ ...draft, authorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Оценка (1–5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    value={draft.rating}
                    placeholder="Необязательно"
                    onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Ссылка на видео</Label>
                  <Input
                    id="videoUrl"
                    value={draft.videoUrl}
                    placeholder="https://youtube.com/…"
                    onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Порядок</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Опубликован</p>
                  <p className="text-sm text-muted-foreground">
                    Выключите, чтобы убрать отзыв с витрины, не удаляя его
                  </p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Отмена
            </Button>
            <Button
              onClick={submit}
              disabled={incomplete || create.isPending || update.isPending}
            >
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title="Удалить отзыв?"
        description="Запись удаляется безвозвратно. Чтобы просто убрать её с витрины, выключите «Опубликован»."
        confirmText="Удалить"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          remove.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
};
