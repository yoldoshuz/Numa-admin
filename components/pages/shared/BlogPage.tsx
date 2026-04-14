"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Eye,
  Archive,
  Trash2,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useBlogPosts,
  useDeleteBlogPost,
  usePublishBlogPost,
  useArchiveBlogPost,
  type BlogFilters,
} from "@/hooks/use-blog";
import { formatDate } from "@/lib/format";
import { STORES } from "@/lib/constants";
import type { BlogPost, StoreSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<BlogPost["status"], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  published: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  archived: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};
const STATUS_LABEL: Record<BlogPost["status"], string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

interface BlogPageProps {
  basePath: string;
  showStoreFilter?: boolean;
}

export const BlogPage = ({ basePath, showStoreFilter = false }: BlogPageProps) => {
  const [status, setStatus] = useState<BlogFilters["status"] | "all">("all");
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const { data, isLoading, isError, error, refetch } = useBlogPosts({
    status: status === "all" ? undefined : status,
    store: showStoreFilter && store !== "all" ? store : undefined,
    limit: 50,
  });
  const del = useDeleteBlogPost();
  const publish = usePublishBlogPost();
  const archive = useArchiveBlogPost();
  const [toDelete, setToDelete] = useState<BlogPost | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Блог"
        description="Публикации, черновики и архив"
        actions={
          <Button asChild>
            <Link href={`${basePath}/blog/new`}>
              <Plus className="size-4" />
              Новый пост
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={status ?? "all"} onValueChange={(v) => setStatus(v === "all" ? "all" : (v as BlogFilters["status"]))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="draft">Черновики</SelectItem>
              <SelectItem value="published">Опубликованные</SelectItem>
              <SelectItem value="archived">Архив</SelectItem>
            </SelectContent>
          </Select>
          {showStoreFilter && (
            <Select value={store} onValueChange={(v) => setStore(v as StoreSlug | "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Магазин" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все магазины</SelectItem>
                {STORES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="cards" rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <Empty
          icon={<Newspaper className="size-5" />}
          title="Постов ещё нет"
          description="Создайте первый пост блога"
          action={
            <Button asChild>
              <Link href={`${basePath}/blog/new`}>
                <Plus className="size-4" />
                Создать
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden">
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Newspaper className="size-8 text-primary/60" />
                </div>
              )}
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn("font-normal", STATUS_COLOR[post.status])}>
                      {STATUS_LABEL[post.status]}
                    </Badge>
                    <StoreBadge store={post.store} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-1">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`${basePath}/blog/${post.id}`}>Редактировать</Link>
                      </DropdownMenuItem>
                      {post.status === "draft" && (
                        <DropdownMenuItem onClick={() => publish.mutate(post.id)}>
                          <Send className="size-4" />
                          Опубликовать
                        </DropdownMenuItem>
                      )}
                      {post.status === "published" && (
                        <DropdownMenuItem onClick={() => archive.mutate(post.id)}>
                          <Archive className="size-4" />
                          В архив
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setToDelete(post)}
                      >
                        <Trash2 className="size-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`${basePath}/blog/${post.id}`}>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{post.title.ru}</h3>
                </Link>
                {post.excerpt?.ru && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{post.excerpt.ru}</p>
                )}
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" />
                    {post.viewCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить пост?"
        description={toDelete ? `"${toDelete.title.ru}" будет удалён` : undefined}
        destructive
        confirmText="Удалить"
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      />
    </div>
  );
};
