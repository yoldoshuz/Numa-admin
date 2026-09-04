"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Package,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { ProductStatusBadge } from "@/components/shared/StatusBadge";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataPagination } from "@/components/shared/DataPagination";
import {
  useProducts,
  useDeleteProduct,
  useReorderProducts,
  useUpdateProductStatus,
  type ProductsFilters,
} from "@/hooks/use-products";
import { useAuthStore } from "@/lib/auth-store";
import { formatPrice, getLocalized } from "@/lib/format";
import type { Product, ProductStatus, StoreSlug } from "@/lib/types";
import { MARKETPLACE_STORES } from "@/lib/constants";

/** Shown on the disabled arrows so the reason is discoverable, not a mystery. */
const PICK_A_STORE =
  "Выберите магазин: порядок задаётся внутри одного магазина, а в общем списке они перемешаны.";

interface ProductsPageProps {
  basePath: string;
  showStoreFilter?: boolean;
}

export const ProductsPage = ({ basePath, showStoreFilter = false }: ProductsPageProps) => {
  const admin = useAuthStore((s) => s.admin);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const filters: ProductsFilters = {
    page,
    limit: 20,
    // The catalogue is shown in the order the storefronts show it, so the
    // arrows below move a product past the neighbour it actually stands next
    // to on the site. Ties resolve newest-first, server-side, which keeps
    // paging stable while most of the catalogue still sits at 0.
    sortBy: "sortOrder",
    sortDir: "asc",
    search: search || undefined,
    status: status === "all" ? undefined : status,
    store:
      showStoreFilter && store !== "all"
        ? store
        : admin?.role === "super_admin"
        ? undefined
        : admin?.store ?? undefined,
  };

  const { data, isLoading, isError, error, refetch } = useProducts(filters);
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();
  const reorder = useReorderProducts();

  const oneStore = !showStoreFilter || store !== "all";

  /*
   * One store: already in `sortOrder` order, because the request asks the
   * server for it. All stores: re-grouped so each shop's shelf stays whole
   * instead of three of them interleaving — `sortOrder` is per-store, so the
   * server's ascending sort alternates between catalogues that each start at
   * 10. The store sequence follows `MARKETPLACE_STORES`, the same order the
   * tabs are in.
   */
  const rows = oneStore
    ? (data?.products ?? [])
    : [...(data?.products ?? [])].sort(
        (a, b) =>
          MARKETPLACE_STORES.findIndex((s) => s.value === a.store) -
            MARKETPLACE_STORES.findIndex((s) => s.value === b.store) ||
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

  /*
   * Reordering only makes sense inside one store: `sortOrder` is per-store, so
   * moving a product past a neighbour from another shop changes nothing on
   * either site. A store-scoped admin is already looking at one store, so the
   * arrows are live for them without picking anything.
   */

  /** Swaps two neighbours' position, numbering the page first if it has no numbers yet. */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;

    const distinct = new Set(rows.map((p) => p.sortOrder ?? 0));
    if (distinct.size < rows.length) {
      /*
       * Every product ships at 0, and swapping two zeroes is a no-op — so the
       * first move hands each row on this page its own number. Numbering is
       * 10, 20, 30… rather than 1, 2, 3: it leaves room to drop a product
       * between two others later without renumbering the shelf.
       */
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      reorder.mutate(next.map((product, i) => ({ product, order: (i + 1) * 10 })));
      return;
    }

    reorder.mutate([
      { product: rows[index], order: rows[target].sortOrder },
      { product: rows[target], order: rows[index].sortOrder },
    ]);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Продукты"
        description="Управление каталогом: порядок на сайте, цены, остатки, статус и медиа"
        actions={
          <Button asChild>
            <Link href={`${basePath}/products/new`}>
              <Plus className="size-4" />
              Создать продукт
            </Link>
          </Button>
        }
      />

      {/*
        Stores are tabs, not one more dropdown in the filter row.

        Three catalogues in a single list read as mush: the shops share nothing
        but a backend, each numbers its shelf from the start, and "which of
        these is mine" was a question the screen made you answer by squinting at
        a badge. A tab is also the honest home for the ordering arrows, since a
        position only means anything inside one shop.
      */}
      {showStoreFilter && (
        <Tabs
          value={store}
          onValueChange={(v) => {
            setStore(v as StoreSlug | "all");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">Все магазины</TabsTrigger>
            {MARKETPLACE_STORES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, SKU…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as ProductStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="draft">Черновики</SelectItem>
              <SelectItem value="archived">Архив</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.products.length ? (
        <Empty
          icon={<Package className="size-5" />}
          title="Продукты не найдены"
          description="Попробуйте изменить фильтры или создать новый продукт"
          action={
            <Button asChild>
              <Link href={`${basePath}/products/new`}>
                <Plus className="size-4" />
                Создать
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Порядок</TableHead>
                    <TableHead className="w-[340px]">Продукт</TableHead>
                    <TableHead>SKU</TableHead>
                    {showStoreFilter && <TableHead>Магазин</TableHead>}
                    <TableHead>Цена</TableHead>
                    <TableHead>Остаток</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p, index) => {
                    const main = p.media?.find((m) => m.isMain) ?? p.media?.[0];
                    /*
                     * In the combined view every shop gets a heading before its
                     * first row, so the three shelves read as three shelves.
                     */
                    const opensStore =
                      !oneStore && (index === 0 || rows[index - 1].store !== p.store);

                    return (
                      <Fragment key={p.id}>
                      {opensStore && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="bg-muted/40 py-2">
                            <span className="flex items-center gap-2">
                              <StoreBadge store={p.store} />
                              <span className="text-xs text-muted-foreground">
                                {rows.filter((r) => r.store === p.store).length} шт.
                              </span>
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="group">
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label="Выше в каталоге"
                                title={oneStore ? undefined : PICK_A_STORE}
                                disabled={!oneStore || index === 0 || reorder.isPending}
                                onClick={() => move(index, -1)}
                              >
                                <ArrowUp className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label="Ниже в каталоге"
                                title={oneStore ? undefined : PICK_A_STORE}
                                disabled={
                                  !oneStore || index === rows.length - 1 || reorder.isPending
                                }
                                onClick={() => move(index, 1)}
                              >
                                <ArrowDown className="size-3.5" />
                              </Button>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {p.sortOrder || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`${basePath}/products/${p.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                              {main ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={main.url} alt="" className="size-full object-cover" />
                              ) : (
                                <Package className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {getLocalized(p.name)}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                            </div>
                            {p.isFeatured && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              >
                                <Star className="size-3" />
                                Хит
                              </Badge>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.sku}
                        </TableCell>
                        {showStoreFilter && (
                          <TableCell>
                            <StoreBadge store={p.store} />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex flex-col">
                            {p.discountPrice ? (
                              <>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatPrice(p.discountPrice)}</span>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(p.price)}
                                </span>
                              </>
                            ) : (
                              <span className="font-medium">{formatPrice(p.price)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              p.stock === 0
                                ? "text-destructive font-medium"
                                : p.stock < 10
                                ? "text-amber-600 dark:text-amber-400 font-medium"
                                : ""
                            }
                          >
                            {p.stock} {p.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ProductStatusBadge status={p.status} />
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
                                <Link href={`${basePath}/products/${p.id}`}>Редактировать</Link>
                              </DropdownMenuItem>
                              {p.status !== "active" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: p.id, status: "active" })
                                  }
                                >
                                  <Eye className="size-4" />
                                  Опубликовать
                                </DropdownMenuItem>
                              )}
                              {p.status === "active" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: p.id, status: "archived" })
                                  }
                                >
                                  <EyeOff className="size-4" />
                                  В архив
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
                      </Fragment>
                    );
                  })}
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить продукт?"
        description={
          toDelete ? (
            <>
              Вы собираетесь удалить <strong>{getLocalized(toDelete.name)}</strong>. Это действие
              нельзя отменить через интерфейс.
            </>
          ) : undefined
        }
        confirmText="Удалить"
        destructive
        loading={deleteProduct.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteProduct.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          });
        }}
      />
    </div>
  );
};

