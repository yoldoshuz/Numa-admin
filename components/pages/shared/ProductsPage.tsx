"use client";

import { useState } from "react";
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
  canWriteAttributes,
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

  /*
   * The table is ordered the way the storefront orders its grid, not the way
   * the API happens to return rows — otherwise the arrows below would move a
   * product relative to a neighbour it does not actually stand next to on the
   * site. The sort is stable, so products sharing a number keep the server's
   * sequence, exactly as the shops resolve a tie.
   */
  const rows = [...(data?.products ?? [])].sort(
    (a, b) => productOrder(a) - productOrder(b)
  );

  /*
   * Ordering is only offered where it can actually be saved. The number lives
   * in `attributes.order`, and the update endpoint replaces `attributes`
   * wholesale while refusing anything but flat scalars — so for a product
   * carrying the seeded image and copy blobs, moving it would either fail or
   * delete them. Arrows are disabled there rather than left to fail on click.
   */
  const canReorder = rows.every((p) => canWriteAttributes(p.attributes));

  /** Swaps two neighbours' `order`, renumbering the page if it has no numbers yet. */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;

    const distinct = new Set(rows.map(productOrder));
    if (distinct.size < rows.length) {
      // Seed data leaves ties (or all zeroes), and swapping equal numbers is a
      // no-op — hand every row on this page its own position first.
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      reorder.mutate(
        next.map((product, i) => ({ product, order: i + 1 }))
      );
      return;
    }

    reorder.mutate([
      { product: rows[index], order: productOrder(rows[target]) },
      { product: rows[target], order: productOrder(rows[index]) },
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
          {showStoreFilter && (
            <Select
              value={store}
              onValueChange={(v) => {
                setStore(v as StoreSlug | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Магазин" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все магазины</SelectItem>
                {MARKETPLACE_STORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label="Выше в каталоге"
                                title={canReorder ? undefined : REORDER_BLOCKED}
                                disabled={!canReorder || index === 0 || reorder.isPending}
                                onClick={() => move(index, -1)}
                              >
                                <ArrowUp className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label="Ниже в каталоге"
                                title={canReorder ? undefined : REORDER_BLOCKED}
                                disabled={
                                  !canReorder || index === rows.length - 1 || reorder.isPending
                                }
                                onClick={() => move(index, 1)}
                              >
                                <ArrowDown className="size-3.5" />
                              </Button>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {productOrder(p) || "—"}
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

/** Shown on the disabled arrows so the reason is discoverable, not a mystery. */
const REORDER_BLOCKED =
  "Порядок пока нельзя менять: он хранится в attributes.order, а PATCH заменяет attributes целиком и не принимает вложенные значения. Нужна доработка бэкенда.";

/**
 * The product's place in the storefront grid.
 *
 * `attributes` is free-form JSONB, so this can legitimately be absent (a
 * product created before ordering was editable) or a string (written by hand);
 * both resolve to 0, which sorts first and keeps the server's sequence.
 */
function productOrder(product: Product): number {
  const value = product.attributes?.order;
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}
