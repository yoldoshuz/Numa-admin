"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductLandingEditor } from "@/components/pages/shared/product-landing/ProductLandingEditor";
import {
  canWriteAttributes,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useAddProductMedia,
  useUploadProductMedia,
  useDeleteProductMedia,
  useSetMainMedia,
} from "@/hooks/use-products";
import { useCategoriesByStore } from "@/hooks/use-categories";
import { useAuthStore } from "@/lib/auth-store";
import { MARKETPLACE_STORES } from "@/lib/constants";
import type { MarketplaceStoreSlug } from "@/lib/types";

const schema = z.object({
  nameRu: z.string().min(2, "Обязательно"),
  nameUz: z.string().min(2, "Обязательно"),
  nameEn: z.string().min(2, "Обязательно"),
  descRu: z.string().optional(),
  descUz: z.string().optional(),
  descEn: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Только строчные буквы, цифры и дефис"),
  sku: z.string().min(1, "Обязательно"),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0),
  unit: z.string().min(1),
  store: z.enum(["nutrition", "kids", "halal"]),
  categoryId: z.string().uuid("Выберите категорию"),
  status: z.enum(["active", "draft", "archived"]),
  isFeatured: z.boolean(),
/**
   * Where the product sits in the storefront grid. Lives in `attributes.order`
   * — the shops sort by it, and the API answers in its own insertion order.
   *
   * Read-only for most products: see `canWriteAttributes`. The field still
   * shows the current number, because "which position is this in" is a
   * question worth answering even when the answer cannot be edited here yet.
   */
  sortOrder: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormPageProps {
  basePath: string;
  productId?: string;
}

export const ProductFormPage = ({ basePath, productId }: ProductFormPageProps) => {
  const router = useRouter();
  const admin = useAuthStore((s) => s.admin);
  const isEdit = !!productId && productId !== "new";
  const { data: product, isLoading, isError, error, refetch } = useProduct(isEdit ? productId : undefined);

  const create = useCreateProduct();
  const update = useUpdateProduct();

  const defaultStore: MarketplaceStoreSlug =
    admin?.role !== "super_admin" && admin?.store && admin.store !== "family"
      ? (admin.store as MarketplaceStoreSlug)
      : "nutrition";

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameRu: "",
      nameUz: "",
      nameEn: "",
      descRu: "",
      descUz: "",
      descEn: "",
      slug: "",
      sku: "",
      price: 0,
      discountPrice: null,
      stock: 0,
      unit: "шт",
      store: defaultStore,
      categoryId: "",
      status: "draft",
      isFeatured: false,
      sortOrder: 0,
    },
  });

  const watchStore = form.watch("store");
  const categories = useCategoriesByStore(watchStore);

  useEffect(() => {
    if (product) {
      form.reset({
        nameRu: product.name.ru,
        nameUz: product.name.uz,
        nameEn: product.name.en,
        descRu: product.description?.ru ?? "",
        descUz: product.description?.uz ?? "",
        descEn: product.description?.en ?? "",
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        unit: product.unit,
        store: product.store as MarketplaceStoreSlug,
        categoryId: product.categoryId,
        status: product.status,
        isFeatured: product.isFeatured,
        sortOrder: Number(product.attributes?.order ?? 0),
      });
    }
  }, [product, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: { ru: values.nameRu, uz: values.nameUz, en: values.nameEn },
      description:
        values.descRu || values.descUz || values.descEn
          ? { ru: values.descRu ?? "", uz: values.descUz ?? "", en: values.descEn ?? "" }
          : null,
      slug: values.slug,
      sku: values.sku,
      price: values.price,
      discountPrice: values.discountPrice || null,
      stock: values.stock,
      unit: values.unit,
      store: values.store,
      categoryId: values.categoryId,
      status: values.status,
      isFeatured: values.isFeatured,
      /*
       * `attributes` is only sent when it can be sent losslessly.
       *
       * The endpoint replaces the whole object instead of merging, and its
       * validator rejects anything that is not a flat scalar — so a product
       * carrying the seeded `images` / `content` / `meters` blobs cannot have
       * its order written from here without either a 422 or silent data loss.
       * Omitting the key leaves the stored attributes untouched.
       */
      ...(orderIsEditable
        ? { attributes: { ...(product?.attributes ?? {}), order: values.sortOrder } }
        : {}),
    };

    if (isEdit && productId) {
      update.mutate(
        { id: productId, ...payload },
        { onSuccess: () => router.push(`${basePath}/products`) }
      );
    } else {
      create.mutate(payload, {
        onSuccess: (p) => router.push(`${basePath}/products/${p.id}`),
      });
    }
  };

  if (isEdit && isLoading) return <Loader variant="form" rows={6} />;
  if (isEdit && isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const flatCats = (categories.data ?? []).flatMap((c) => [
    c,
    ...(c.subcategories ?? []),
  ]);

  const orderIsEditable = !isEdit || canWriteAttributes(product?.attributes);

  const mainForm = (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Название и описание</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="ru">
                  <TabsList>
                    <TabsTrigger value="ru">Русский</TabsTrigger>
                    <TabsTrigger value="uz">O&apos;zbekcha</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ru" className="space-y-4 pt-4">
                    <LocalizedField label="Название (RU)" {...form.register("nameRu")} error={form.formState.errors.nameRu?.message} />
                    <LocalizedTextarea label="Описание (RU)" {...form.register("descRu")} />
                  </TabsContent>
                  <TabsContent value="uz" className="space-y-4 pt-4">
                    <LocalizedField label="Название (UZ)" {...form.register("nameUz")} error={form.formState.errors.nameUz?.message} />
                    <LocalizedTextarea label="Описание (UZ)" {...form.register("descUz")} />
                  </TabsContent>
                  <TabsContent value="en" className="space-y-4 pt-4">
                    <LocalizedField label="Название (EN)" {...form.register("nameEn")} error={form.formState.errors.nameEn?.message} />
                    <LocalizedTextarea label="Описание (EN)" {...form.register("descEn")} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Цены и остатки</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Цена (сум)</Label>
                  <Input id="price" type="number" {...form.register("price")} />
                  {form.formState.errors.price && <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Цена со скидкой</Label>
                  <Input id="discountPrice" type="number" {...form.register("discountPrice")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Остаток</Label>
                  <Input id="stock" type="number" {...form.register("stock")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Единица</Label>
                  <Input id="unit" {...form.register("unit")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...form.register("sku")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" placeholder="omega-3-premium" {...form.register("slug")} />
                  {form.formState.errors.slug && <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sortOrder">Порядок на сайте</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    disabled={!orderIsEditable}
                    {...form.register("sortOrder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {orderIsEditable ? (
                      <>
                        Чем меньше число, тем выше товар в каталоге витрины. Товары
                        с одинаковым числом остаются в порядке, который вернул
                        сервер.
                      </>
                    ) : (
                      <>
                        Пока только для чтения: у этого товара есть вложенные
                        <code className="mx-1 font-mono">attributes</code>
                        (сиды изображений и копирайта), а <code className="font-mono">PATCH</code>{" "}
                        их не принимает и затирает. Нужна доработка бэкенда —
                        мерж <code className="font-mono">attributes</code> или
                        отдельное поле сортировки.
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {isEdit && product && <MediaPanel productId={product.id} media={product.media} />}
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Публикация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="archived">Архив</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Star className="size-4 text-amber-500" />
                      Хит продаж
                    </Label>
                    <p className="text-xs text-muted-foreground">Выделить в витрине</p>
                  </div>
                  <Switch
                    checked={form.watch("isFeatured")}
                    onCheckedChange={(v) => form.setValue("isFeatured", v)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Размещение</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Магазин</Label>
                  <Select
                    value={form.watch("store")}
                    onValueChange={(v) => {
                      form.setValue("store", v as MarketplaceStoreSlug);
                      form.setValue("categoryId", "");
                    }}
                    disabled={admin?.role !== "super_admin"}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MARKETPLACE_STORES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select
                    value={form.watch("categoryId")}
                    onValueChange={(v) => form.setValue("categoryId", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={categories.isLoading ? "Загрузка…" : "Выберите"} />
                    </SelectTrigger>
                    <SelectContent>
                      {flatCats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name.ru}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Spinner className="size-4" />}
              <Save className="size-4" />
              {isEdit ? "Сохранить изменения" : "Создать продукт"}
            </Button>
          </div>
        </div>
      </form>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? `Редактирование: ${product?.name.ru}` : "Новый продукт"}
        description={
          isEdit
            ? "Данные, медиа и содержимое страницы товара"
            : "Создание нового продукта в каталоге"
        }
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${basePath}/products`}>
              <ArrowLeft className="size-4" />
              Назад
            </Link>
          </Button>
        }
      />

      {isEdit && product ? (
        /*
         * Two tabs rather than one long page, and the landing editor lives
         * outside the `<form>` above on purpose: its buttons are its own, and
         * nested inside a form every one of them would have submitted the
         * product. Leaving the tab unmounts the block form, which flushes its
         * pending autosave.
         */
        <Tabs defaultValue="main">
          <TabsList>
            <TabsTrigger value="main">Товар</TabsTrigger>
            <TabsTrigger value="landing">Страница товара</TabsTrigger>
          </TabsList>
          <TabsContent value="main" className="pt-5">
            {mainForm}
          </TabsContent>
          <TabsContent value="landing" className="pt-5">
            <ProductLandingEditor productId={product.id} />
          </TabsContent>
        </Tabs>
      ) : (
        mainForm
      )}
    </div>
  );
};

const LocalizedField = ({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input {...props} />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const LocalizedTextarea = ({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Textarea rows={5} {...props} />
  </div>
);

const MediaPanel = ({
  productId,
  media,
}: {
  productId: string;
  media: { id: string; url: string; isMain: boolean; type: string }[];
}) => {
  const [url, setUrl] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddProductMedia();
  const upload = useUploadProductMedia();
  const del = useDeleteProductMedia();
  const setMain = useSetMainMedia();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Медиа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) {
              upload.mutate({
                id: productId,
                files,
                isMain: media.length === 0,
                sortOrder: media.length,
              });
            }
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? <Spinner className="size-4" /> : <Upload className="size-4" />}
          Загрузить файлы
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="или URL: https://cdn.numa.uz/products/image.webp"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              if (!url) return;
              add.mutate(
                { id: productId, url, type: "image", isMain: media.length === 0 },
                { onSuccess: () => setUrl("") }
              );
            }}
            disabled={add.isPending || !url}
          >
            {add.isPending ? <Spinner className="size-4" /> : <Plus className="size-4" />}
            Добавить
          </Button>
        </div>
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <ImagePlus className="size-6" />
            Медиа ещё не добавлены
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.map((m) => (
              <div
                key={m.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="size-full object-cover" />
                {m.isMain && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Главное
                  </span>
                )}
                <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/70 via-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!m.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMain.mutate({ id: productId, mediaId: m.id })}
                    >
                      <Star className="size-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setToDelete(m.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить изображение?"
        confirmText="Удалить"
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(
            { id: productId, mediaId: toDelete },
            { onSuccess: () => setToDelete(null) }
          );
        }}
      />
    </Card>
  );
};
