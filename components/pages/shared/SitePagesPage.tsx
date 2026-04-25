"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import {
  useSitePages,
  useCreateSitePage,
  usePublishSitePage,
  useDeleteSitePage,
} from "@/hooks/use-sites";
import { useAuthStore } from "@/lib/auth-store";
import { STORES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { SitePage, StoreSlug } from "@/lib/types";

interface SitePagesPageProps {
  basePath: string;
  showStoreFilter?: boolean;
}

export const SitePagesPage = ({ basePath, showStoreFilter = false }: SitePagesPageProps) => {
  const admin = useAuthStore((s) => s.admin);
  const isSuper = admin?.role === "super_admin";

  const initialStore: StoreSlug = isSuper ? "nutrition" : ((admin?.store as StoreSlug) ?? "nutrition");
  const [store, setStore] = useState<StoreSlug>(initialStore);

  const { data, isLoading, isError, error, refetch } = useSitePages(store);
  const create = useCreateSitePage(store);
  const publish = usePublishSitePage(store);
  const del = useDeleteSitePage(store);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [toDelete, setToDelete] = useState<SitePage | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Сайт"
        description="Страницы и контент-секции"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${basePath}/site/settings?store=${store}`}>
                <Settings className="size-4" />
                Настройки сайта
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Новая страница
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать страницу</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="about"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Только строчные латинские буквы, цифры и дефис.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    disabled={!/^[a-z0-9-]+$/.test(newSlug) || create.isPending}
                    onClick={() => {
                      create.mutate(
                        { slug: newSlug },
                        {
                          onSuccess: () => {
                            setDialogOpen(false);
                            setNewSlug("");
                          },
                        }
                      );
                    }}
                  >
                    Создать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {(showStoreFilter || isSuper) && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Label className="text-xs">Магазин</Label>
            <Select value={store} onValueChange={(v) => setStore(v as StoreSlug)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORES.filter((s) => isSuper || s.value === admin?.store).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StoreBadge store={store} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Loader variant="table" rows={5} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <Empty
          icon={<FileText className="size-5" />}
          title="Нет страниц"
          description="Создайте первую CMS-страницу"
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Создать
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Опубликовано</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">/{p.slug}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {p.metaTitle?.ru || p.metaTitle?.en || "—"}
                    </TableCell>
                    <TableCell>
                      {p.isPublished ? (
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
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.publishedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`${basePath}/site/${store}/${p.slug}`}>
                              <ExternalLink className="size-4" />
                              Открыть
                            </Link>
                          </DropdownMenuItem>
                          {p.isPublished ? (
                            <DropdownMenuItem
                              onClick={() => publish.mutate({ id: p.id, publish: false })}
                            >
                              <EyeOff className="size-4" />
                              Снять с публикации
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => publish.mutate({ id: p.id, publish: true })}
                            >
                              <Eye className="size-4" />
                              Опубликовать
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setToDelete(p)}
                          >
                            <Trash2 className="size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить страницу?"
        description={toDelete ? `Страница /${toDelete.slug} будет удалена со всеми секциями.` : undefined}
        destructive
        confirmText="Удалить"
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(
            { id: toDelete.id, slug: toDelete.slug },
            { onSuccess: () => setToDelete(null) }
          );
        }}
      />
    </div>
  );
};
