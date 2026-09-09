"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useClearImageSlot,
  useDeleteProductMedia,
  useImageSlots,
  usePutImageSlot,
  useSwapImageSlots,
} from "@/hooks/use-products";
import type {
  ImageSlotKey,
  ImageSlotMeta,
  ProductImage,
  ProductMedia,
} from "@/lib/types";

const GROUP_TITLES: Record<ImageSlotMeta["group"], string> = {
  gallery: "Обзор продукта",
  info: "Изображения в блоках страницы",
};

const GROUP_HINTS: Record<ImageSlotMeta["group"], string> = {
  gallery: "Слайдер карточки. Первый слот — главное фото: каталог, корзина, первый слайд.",
  info: "Каждый слот — своя секция лендинга. Пустой слот секцию не ломает: она отрисуется без картинки.",
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function ImageSlotsPanel({
  productId,
  media,
  images,
}: {
  productId: string;
  media: ProductMedia[];
  images: Partial<Record<ImageSlotKey, ProductImage | null>> | undefined;
}) {
  const { data: slots, isLoading, isError } = useImageSlots();
  const put = usePutImageSlot();
  const clear = useClearImageSlot();
  const swap = useSwapImageSlots();

  const [toClear, setToClear] = useState<ImageSlotMeta | null>(null);
  const [pendingSlot, setPendingSlot] = useState<ImageSlotKey | null>(null);

  // Anything still outside the slot system: videos, plus whatever was uploaded
  // before slots existed. The storefront ignores these, so they are shown apart
  // rather than mixed in — a thumbnail in the grid would imply it is on the page.
  const unslotted = media.filter((m) => !m.slot);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Изображения</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !slots?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Изображения</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Не удалось загрузить список слотов. Обновите страницу — без справочника
          редактор не знает, какие места есть на странице товара.
        </CardContent>
      </Card>
    );
  }

  // The reference list arrives in the order the sections appear on the
  // storefront, so the groups are built by walking it rather than by sorting.
  const groups: { group: ImageSlotMeta["group"]; slots: ImageSlotMeta[] }[] = [];
  for (const slot of slots) {
    const last = groups.at(-1);
    if (last?.group === slot.group) last.slots.push(slot);
    else groups.push({ group: slot.group, slots: [slot] });
  }

  const galleryKeys = slots.filter((s) => s.group === "gallery").map((s) => s.slot);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Изображения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {groups.map(({ group, slots: groupSlots }) => (
          <section key={group} className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">{GROUP_TITLES[group]}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{GROUP_HINTS[group]}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupSlots.map((meta) => (
                <SlotCard
                  key={meta.slot}
                  meta={meta}
                  image={images?.[meta.slot] ?? null}
                  busy={pendingSlot === meta.slot}
                  galleryKeys={group === "gallery" ? galleryKeys : undefined}
                  onUpload={(file) => {
                    setPendingSlot(meta.slot);
                    put.mutate(
                      { id: productId, slot: meta.slot, file },
                      { onSettled: () => setPendingSlot(null) },
                    );
                  }}
                  onUrl={(url) => {
                    setPendingSlot(meta.slot);
                    put.mutate(
                      { id: productId, slot: meta.slot, url },
                      { onSettled: () => setPendingSlot(null) },
                    );
                  }}
                  onClear={() => setToClear(meta)}
                  onMove={(to) => swap.mutate({ id: productId, from: meta.slot, to })}
                />
              ))}
            </div>
          </section>
        ))}

        {unslotted.length > 0 && (
          <UnslottedSection productId={productId} items={unslotted} />
        )}
      </CardContent>

      <ConfirmDialog
        open={!!toClear}
        onOpenChange={(v) => !v && setToClear(null)}
        title={`Очистить слот «${toClear?.label.ru ?? ""}»?`}
        description="Файл будет удалён с диска. Секция на витрине отрисуется без картинки."
        confirmText="Очистить"
        destructive
        loading={clear.isPending}
        onConfirm={() => {
          if (!toClear) return;
          clear.mutate(
            { id: productId, slot: toClear.slot },
            { onSuccess: () => setToClear(null) },
          );
        }}
      />
    </Card>
  );
}

function SlotCard({
  meta,
  image,
  busy,
  galleryKeys,
  onUpload,
  onUrl,
  onClear,
  onMove,
}: {
  meta: ImageSlotMeta;
  image: ProductImage | null;
  busy: boolean;
  /** Present only for the overview slider, where order is meaningful. */
  galleryKeys?: ImageSlotKey[];
  onUpload: (file: File) => void;
  onUrl: (url: string) => void;
  onClear: () => void;
  onMove: (to: ImageSlotKey) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);

  const index = galleryKeys?.indexOf(meta.slot) ?? -1;
  const prev = index > 0 ? galleryKeys?.[index - 1] : undefined;
  const next =
    galleryKeys && index >= 0 && index < galleryKeys.length - 1
      ? galleryKeys[index + 1]
      : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium" title={meta.label.ru}>
          {meta.label.ru}
          {meta.required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {meta.aspectRatio}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />

      {/*
        The box holds the slot's own aspect ratio whether or not it is filled,
        so the grid does not reflow as pictures load — and so an empty slot
        already shows the shape the picture has to be.
      */}
      <div
        style={{ aspectRatio: `${meta.width} / ${meta.height}` }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onUpload(file);
        }}
        className={`group relative overflow-hidden rounded-lg border bg-muted transition-colors ${
          dragging ? "border-primary bg-primary/5" : image ? "" : "border-dashed"
        }`}
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-center gap-1 bg-gradient-to-t from-black/70 via-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {prev && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  title="Сдвинуть влево"
                  onClick={() => onMove(prev)}
                >
                  <ArrowLeft className="size-3" />
                </Button>
              )}
              {next && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  title="Сдвинуть вправо"
                  onClick={() => onMove(next)}
                >
                  <ArrowRight className="size-3" />
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                title="Заменить"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                title="Очистить слот"
                onClick={onClear}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="size-5" />
            <span className="text-xs">Перетащите или выберите</span>
          </button>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Spinner className="size-5" />
          </div>
        )}
      </div>

      {urlMode ? (
        <div className="flex gap-1.5">
          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://cdn…/image.webp"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !url.trim()) return;
              e.preventDefault();
              onUrl(url.trim());
              setUrl("");
              setUrlMode(false);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="size-8 shrink-0 p-0"
            title="Отмена"
            onClick={() => {
              setUrl("");
              setUrlMode(false);
            }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {meta.width}×{meta.height}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setUrlMode(true)}
          >
            <Link2 className="size-3" />
            Ссылка
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Videos and pre-slot uploads.
 *
 * Deleting is the only action offered: there is nowhere to promote them to
 * without knowing which section they were meant for, and guessing would put a
 * picture in a place the content manager never chose.
 */
function UnslottedSection({
  productId,
  items,
}: {
  productId: string;
  items: ProductMedia[];
}) {
  const del = useDeleteProductMedia();
  const [toDelete, setToDelete] = useState<string | null>(null);

  return (
    <section className="space-y-3 border-t pt-6">
      <div>
        <h3 className="text-sm font-medium">Без слота</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Видео и файлы, загруженные до появления слотов. На витрине не
          показываются — залейте их в нужный слот выше и удалите отсюда.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((m) => (
          <div
            key={m.id}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {m.type === "video" ? (
              <video src={m.url} className="size-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="size-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить файл?"
        confirmText="Удалить"
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(
            { id: productId, mediaId: toDelete },
            { onSuccess: () => setToDelete(null) },
          );
        }}
      />
    </section>
  );
}
