"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LayoutList,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/states/Error";
import { Loader } from "@/components/states/Loader";
import {
  useBlockSchemas,
  useCreateProductBlock,
  useDeleteProductBlock,
  useProductBlocks,
  useReorderProductBlocks,
  useUpdateProductBlock,
} from "@/hooks/use-product-blocks";
import type {
  BlockData,
  BlockSchemas,
  ProductBlock,
  ProductBlockType,
} from "@/lib/types";
import { BlockFields } from "./BlockFields";
import { BlockPreview } from "./BlockPreview";
import {
  blockHint,
  blockLabel,
  defaultData,
  isLanguageEmpty,
  LANGUAGES,
  LANGUAGE_LABEL,
  missingRequired,
  normalizeData,
  type BlockLanguage,
} from "./block-meta";

/**
 * The "Лендинг" tab of a product card: the sections of the product page, in the
 * order they appear on it, editable in three languages.
 *
 * Everything a customer reads below the price used to be hardcoded in each
 * storefront, so the admin could change a name, a description, a photo and the
 * stock and nothing else. These blocks are that page.
 */
export const ProductLandingEditor = ({ productId }: { productId: string }) => {
  const blocks = useProductBlocks(productId);
  const schemas = useBlockSchemas();

  const [language, setLanguage] = useState<BlockLanguage>("ru");
  /** The block the moderator picked. Resolved against the list below. */
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const reorder = useReorderProductBlocks(productId);
  const update = useUpdateProductBlock(productId);
  const create = useCreateProductBlock(productId);
  const del = useDeleteProductBlock(productId);
  const [toDelete, setToDelete] = useState<ProductBlock | null>(null);

  const list = blocks.data ?? [];

  /*
   * Derived rather than stored: the first block stands selected until one is
   * picked, and a block that has just been deleted falls back to the first
   * without a render pass in between showing an empty panel.
   */
  const selected = list.find((block) => block.id === pickedId) ?? list[0] ?? null;

  const schemaFor = useMemo(() => {
    const map = new Map(schemas.data?.types.map((t) => [t.type, t]) ?? []);
    return (type: ProductBlockType) => map.get(type);
  }, [schemas.data]);

  if (blocks.isLoading || schemas.isLoading) return <Loader variant="form" rows={6} />;
  if (blocks.isError) {
    return <ErrorState error={blocks.error} onRetry={() => blocks.refetch()} />;
  }
  if (schemas.isError) {
    return <ErrorState error={schemas.error} onRetry={() => schemas.refetch()} />;
  }

  const limits = schemas.data?.limits;
  const atBlockLimit = !!limits && list.length >= limits.maxBlocksPerProduct;
  const published = list.filter((block) => block.isVisible).length;

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((b) => b.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LayoutList className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Секции страницы товара</p>
              <Badge variant="outline" className="font-normal">
                {published} из {list.length} показывается
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Слева — секции сверху вниз, ровно в том порядке, в котором они идут
              на сайте. Выберите секцию, чтобы отредактировать текст; справа сразу
              видно, что получится.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* One language switch for the whole tab: a block is translated as
                a unit, and per-field switches meant nine of them on screen. */}
            <Tabs value={language} onValueChange={(v) => setLanguage(v as BlockLanguage)}>
              <TabsList>
                {LANGUAGES.map((lang) => (
                  <TabsTrigger key={lang} value={lang}>
                    {LANGUAGE_LABEL[lang]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button size="sm" disabled={atBlockLimit} onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Добавить блок
            </Button>
          </div>
        </CardContent>
      </Card>

      {/*
        Three columns from `xl`: the shelf of sections, the form, and the
        preview. The preview used to sit under the form, which meant the answer
        to "what will this look like" was a scroll away from the field you were
        typing in — on a nine-block page with lists inside, a long scroll.
        Below `xl` it drops under the form, where it was.
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              Блоки
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {list.length}
                {limits ? ` / ${limits.maxBlocksPerProduct}` : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Блоков нет
              </p>
            ) : (
              list.map((block, index) => {
                const schema = schemaFor(block.type);
                const data = normalizeData(schema?.fields, block.data);
                return (
                  <div
                    key={block.id}
                    className={`rounded-lg border transition ${
                      block.id === selected?.id
                        ? "border-primary bg-accent/50"
                        : "bg-card"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPickedId(block.id)}
                      className="flex w-full items-start gap-2 px-3 pt-2.5 text-left"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {blockLabel(block.type, schema?.titleRu)}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1">
                          {!block.isVisible && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Скрыт
                            </Badge>
                          )}
                          {LANGUAGES.filter((lang) =>
                            isLanguageEmpty(schema?.fields, data, lang)
                          ).map((lang) => (
                            <Badge
                              key={lang}
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            >
                              {LANGUAGE_LABEL[lang]} пусто
                            </Badge>
                          ))}
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={index === 0 || reorder.isPending}
                          onClick={() => move(index, -1)}
                          aria-label="Выше"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={index === list.length - 1 || reorder.isPending}
                          onClick={() => move(index, 1)}
                          aria-label="Ниже"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {/*
                          Publication is its own PATCH with no `data` in it, so
                          showing a block never depends on whether the open form
                          has been saved.
                        */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={block.isVisible ? "Скрыть" : "Опубликовать"}
                          onClick={() =>
                            update.mutate({
                              blockId: block.id,
                              type: block.type,
                              isVisible: !block.isVisible,
                            })
                          }
                        >
                          {block.isVisible ? (
                            <Eye className="size-3.5" />
                          ) : (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          aria-label="Удалить"
                          onClick={() => setToDelete(block)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {selected && schemas.data ? (
          <BlockForm
            // Remounting per block gives each one its own draft and flushes the
            // previous one's pending save on the way out.
            key={selected.id}
            productId={productId}
            block={selected}
            schemas={schemas.data}
            language={language}
          />
        ) : (
          // Spans the form and preview columns, so an empty state does not leave
          // a narrow card floating next to two gaps.
          <Card className="xl:col-span-2">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Выберите секцию слева
            </CardContent>
          </Card>
        )}
      </div>

      <AddBlockDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        schemas={schemas.data}
        pending={create.isPending}
        onCreate={(type) => {
          const schema = schemaFor(type);
          create.mutate(
            { type, data: defaultData(schema?.fields), isVisible: false },
            { onSuccess: (block) => { setPickedId(block.id); setAddOpen(false); } }
          );
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить блок?"
        description={
          toDelete ? (
            <>
              Блок «{blockLabel(toDelete.type, schemaFor(toDelete.type)?.titleRu)}» будет
              удалён безвозвратно. Если он может понадобиться позже — скройте его
              вместо удаления.
            </>
          ) : undefined
        }
        confirmText="Удалить"
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      />
    </div>
  );
};

/** Debounce for the autosave, per the backend's own recommendation. */
const AUTOSAVE_MS = 1500;

const BlockForm = ({
  productId,
  block,
  schemas,
  language,
}: {
  productId: string;
  block: ProductBlock;
  schemas: BlockSchemas;
  language: BlockLanguage;
}) => {
  const schema = schemas.types.find((t) => t.type === block.type);
  const update = useUpdateProductBlock(productId);

  const [draft, setDraft] = useState<BlockData>(() =>
    normalizeData(schema?.fields, block.data)
  );
  const [dirty, setDirty] = useState(false);

  const save = (data: BlockData) =>
    update.mutate(
      { blockId: block.id, type: block.type, data, silent: true },
      { onSuccess: () => setDirty(false) }
    );

  /*
   * The last committed draft and the save that goes with it, so a deferred
   * write sends the keystrokes from a second ago rather than whatever its own
   * closure captured when it was scheduled. Written in an effect on every
   * render, never during one.
   */
  const latest = useRef({ draft, dirty, save });
  useEffect(() => {
    latest.current = { draft, dirty, save };
  });

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      const { draft: data, save: write } = latest.current;
      write(data);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [draft, dirty]);

  // Switching blocks (or leaving the tab) must not drop what was typed a second
  // ago — the debounce is a convenience, not a place to lose work.
  useEffect(
    () => () => {
      const last = latest.current;
      if (last.dirty) last.save(last.draft);
    },
    []
  );

  const incomplete = missingRequired(schema?.fields, draft);

  return (
    <>
    <Card className="h-fit">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">
            {blockLabel(block.type, schema?.titleRu)}
          </CardTitle>
          {/* What this section is and where it lands, so choosing between
              "Описание и цифры" and "Шкалы эффективности" does not require
              opening the site. */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {blockHint(block.type)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SaveState dirty={dirty} pending={update.isPending} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty || update.isPending}
            onClick={() => save(draft)}
          >
            <Save className="size-4" />
            Сохранить
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!schema && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            Бэкенд не описал тип «{block.type}» — обновите админку или проверьте
            версию API.
          </p>
        )}

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor={`visible-${block.id}`}>Показывать на сайте</Label>
            <p className="text-xs text-muted-foreground">
              {block.isVisible
                ? "Секция видна покупателям."
                : "Секция скрыта: текст сохраняется, но на сайте её нет."}
            </p>
          </div>
          <Switch
            id={`visible-${block.id}`}
            checked={block.isVisible}
            onCheckedChange={(v) =>
              update.mutate({ blockId: block.id, type: block.type, isVisible: v })
            }
          />
        </div>

        {incomplete && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            Обязательные поля (со звёздочкой) заполнены не полностью — секцию лучше
            пока не показывать на сайте.
          </p>
        )}

        <BlockFields
          fields={schema?.fields}
          data={draft}
          language={language}
          icons={schemas.icons}
          limits={schemas.limits}
          onChange={(next) => {
            setDraft(next);
            setDirty(true);
          }}
        />

      </CardContent>
    </Card>

      {/*
        Sticky, so it stays beside the field being edited on a long block —
        `specs` and `benefits` run to thirty rows.
      */}
      <Card className="h-fit xl:sticky xl:top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4 text-muted-foreground" />
            Предпросмотр
            <Badge variant="outline" className="font-normal">
              {LANGUAGE_LABEL[language]}
            </Badge>
          </CardTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Так секция читается на выбранном языке. Оформление на сайте своё у
            каждого магазина.
          </p>
        </CardHeader>
        <CardContent>
          <BlockPreview fields={schema?.fields} data={draft} language={language} />
        </CardContent>
      </Card>
    </>
  );
};

const SaveState = ({ dirty, pending }: { dirty: boolean; pending: boolean }) => {
  if (pending) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Spinner className="size-3" />
        Сохраняем…
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="text-xs text-amber-700 dark:text-amber-300">
        Есть несохранённые изменения
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
      Сохранено
    </span>
  );
};

const AddBlockDialog = ({
  open,
  onOpenChange,
  schemas,
  pending,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schemas: BlockSchemas | undefined;
  pending: boolean;
  onCreate: (type: ProductBlockType) => void;
}) => {
  const [type, setType] = useState<ProductBlockType | "">("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый блок</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Тип блока</Label>
          <Select value={type} onValueChange={(v) => setType(v as ProductBlockType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              {(schemas?.types ?? []).map((t) => (
                <SelectItem key={t.type} value={t.type}>
                  {blockLabel(t.type, t.titleRu)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Блок добавится в конец страницы и скрытым — заполните его и включите
            показ.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!type || pending} onClick={() => type && onCreate(type)}>
            {pending && <Spinner className="size-4" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
