"use client";

import { useState } from "react";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import {
  useCategoriesByStore,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { useAuthStore } from "@/lib/auth-store";
import { MARKETPLACE_STORES } from "@/lib/constants";
import type { Category, StoreSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoriesPageProps {
  showStoreSelector?: boolean;
}

export const CategoriesPage = ({ showStoreSelector = false }: CategoriesPageProps) => {
  const admin = useAuthStore((s) => s.admin);
  const [selectedStore, setSelectedStore] = useState<StoreSlug>(
    (admin?.store as StoreSlug) || "nutrition"
  );
  const store: StoreSlug = showStoreSelector
    ? selectedStore
    : (admin?.store as StoreSlug) || "nutrition";

  const { data, isLoading, isError, error, refetch } = useCategoriesByStore(store);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const del = useDeleteCategory();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Категории"
        description="Древовидная структура категорий магазина"
        actions={
          <div className="flex items-center gap-2">
            {showStoreSelector && (
              <Select value={selectedStore} onValueChange={(v) => setSelectedStore(v as StoreSlug)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKETPLACE_STORES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Новая категория
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Loader variant="table" rows={5} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <Empty
          icon={<FolderTree className="size-5" />}
          title="Категории не созданы"
          description="Начните с добавления первой категории"
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Создать категорию
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {data.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                onEdit={setEditing}
                onDelete={setToDelete}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <CategoryDialog
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        category={editing}
        store={store}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить категорию?"
        description={toDelete ? `Категория "${toDelete.name.ru}" будет удалена` : undefined}
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

const CategoryRow = ({
  category,
  level = 0,
  onEdit,
  onDelete,
}: {
  category: Category;
  level?: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) => (
  <>
    <div
      className={cn("flex items-center gap-3 p-3 transition-colors hover:bg-accent/30")}
      style={{ paddingLeft: 12 + level * 24 }}
    >
      <FolderTree className="size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{category.name.ru}</p>
        <p className="truncate text-xs text-muted-foreground">/{category.slug}</p>
      </div>
      <StoreBadge store={category.store} />
      {!category.isActive && (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Неактивна
        </span>
      )}
      <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(category)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
    {category.subcategories?.map((sub) => (
      <CategoryRow
        key={sub.id}
        category={sub}
        level={level + 1}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </>
);

const CategoryDialog = ({
  open,
  mode,
  category,
  store,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  category: Category | null;
  store: StoreSlug;
  onClose: () => void;
}) => {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [form, setForm] = useState({
    nameRu: "",
    nameUz: "",
    nameEn: "",
    slug: "",
    isActive: true,
    sortOrder: 0,
  });

  // reset on open
  const [opened, setOpened] = useState(false);
  if (open && !opened) {
    setOpened(true);
    setForm({
      nameRu: category?.name.ru ?? "",
      nameUz: category?.name.uz ?? "",
      nameEn: category?.name.en ?? "",
      slug: category?.slug ?? "",
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder ?? 0,
    });
  }
  if (!open && opened) setOpened(false);

  const handleSubmit = () => {
    const payload = {
      name: { ru: form.nameRu, uz: form.nameUz, en: form.nameEn },
      slug: form.slug,
      store,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };
    if (mode === "edit" && category) {
      update.mutate({ id: category.id, ...payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Редактировать категорию" : "Новая категория"}
          </DialogTitle>
          <DialogDescription>Заполните поля для всех языков</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Tabs defaultValue="ru">
            <TabsList>
              <TabsTrigger value="ru">RU</TabsTrigger>
              <TabsTrigger value="uz">UZ</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
            </TabsList>
            <TabsContent value="ru" className="pt-3">
              <Label>Название (RU)</Label>
              <Input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
            </TabsContent>
            <TabsContent value="uz" className="pt-3">
              <Label>Nomi (UZ)</Label>
              <Input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
            </TabsContent>
            <TabsContent value="en" className="pt-3">
              <Label>Name (EN)</Label>
              <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            </TabsContent>
          </Tabs>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="vitamins"
              />
            </div>
            <div className="space-y-2">
              <Label>Порядок</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Активна</Label>
              <p className="text-xs text-muted-foreground">Показывать в каталоге</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && <Spinner className="size-4" />}
            {mode === "edit" ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
