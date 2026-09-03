"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BlockData, BlockField, BlockLimits } from "@/lib/types";
import { BlockIcon, iconCaption } from "./block-icons";
import {
  asList,
  asLocalized,
  defaultData,
  fieldLabel,
  isMultiline,
  itemLabel,
  type BlockLanguage,
} from "./block-meta";

interface BlockFieldsProps {
  fields: BlockField[] | undefined;
  data: BlockData;
  language: BlockLanguage;
  icons: string[];
  limits: BlockLimits | undefined;
  onChange: (next: BlockData) => void;
  /** Nested lists indent instead of drawing a second card border. */
  nested?: boolean;
}

/**
 * A block's form, built from the schema the backend describes rather than from
 * structures written here — that is what lets a new block type or a new field
 * appear without a release of the admin.
 */
export const BlockFields = ({
  fields,
  data,
  language,
  icons,
  limits,
  onChange,
  nested = false,
}: BlockFieldsProps) => {
  const set = (name: string, value: unknown) => onChange({ ...data, [name]: value });

  return (
    <div className={nested ? "space-y-3" : "space-y-4"}>
      {(fields ?? []).map((field) => {
        switch (field.kind) {
          case "list":
            return (
              <ListField
                key={field.name}
                field={field}
                rows={asList(data[field.name])}
                language={language}
                icons={icons}
                limits={limits}
                onChange={(rows) => set(field.name, rows)}
              />
            );

          case "number":
            return (
              <div key={field.name} className="space-y-1.5">
                <Label>
                  {fieldLabel(field.name)}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={typeof data[field.name] === "number" ? (data[field.name] as number) : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") return set(field.name, field.min ?? 0);
                    const clamped = Math.min(
                      field.max ?? Number.MAX_SAFE_INTEGER,
                      Math.max(field.min ?? Number.MIN_SAFE_INTEGER, Number(raw))
                    );
                    set(field.name, Math.round(clamped));
                  }}
                  className="w-32"
                />
              </div>
            );

          case "icon":
            return (
              <IconField
                key={field.name}
                label={fieldLabel(field.name)}
                icons={icons}
                value={typeof data[field.name] === "string" ? (data[field.name] as string) : ""}
                onChange={(value) => set(field.name, value)}
              />
            );

          default: {
            const localized = asLocalized(data[field.name]);
            const Control = isMultiline(field.name) ? Textarea : Input;
            const value = localized[language];
            return (
              <div key={field.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>
                    {fieldLabel(field.name)}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {limits && value.length > limits.maxTextLength * 0.9 && (
                    <span
                      className={
                        value.length > limits.maxTextLength
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {value.length} / {limits.maxTextLength}
                    </span>
                  )}
                </div>
                <Control
                  {...(isMultiline(field.name) ? { rows: 4 } : {})}
                  maxLength={limits?.maxTextLength}
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    set(field.name, { ...localized, [language]: e.target.value })
                  }
                />
              </div>
            );
          }
        }
      })}
    </div>
  );
};

const ListField = ({
  field,
  rows,
  language,
  icons,
  limits,
  onChange,
}: {
  field: BlockField;
  rows: BlockData[];
  language: BlockLanguage;
  icons: string[];
  limits: BlockLimits | undefined;
  onChange: (rows: BlockData[]) => void;
}) => {
  const max = field.maxItems ?? limits?.maxItemsPerBlock ?? 30;
  const full = rows.length >= max;

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {fieldLabel(field.name)}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {rows.length} / {max}
          </span>
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={full}
          onClick={() => onChange([...rows, defaultData(field.fields)])}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          Пусто — добавьте первый элемент
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={index} className="rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {itemLabel(field.name)} {index + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0}
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
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Ниже"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <BlockFields
                  nested
                  fields={field.fields}
                  data={row}
                  language={language}
                  icons={icons}
                  limits={limits}
                  onChange={(next) =>
                    onChange(rows.map((r, i) => (i === index ? next : r)))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const IconField = ({
  label,
  icons,
  value,
  onChange,
}: {
  label: string;
  icons: string[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="justify-start gap-2">
              {value ? (
                <>
                  <BlockIcon name={value} className="size-4" />
                  {iconCaption(value)}
                </>
              ) : (
                "Выбрать иконку"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2">
            {icons.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Набор иконок ещё не загружен
              </p>
            ) : (
              <div className="grid max-h-64 grid-cols-5 gap-1 overflow-y-auto">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    title={iconCaption(icon)}
                    onClick={() => {
                      onChange(icon);
                      setOpen(false);
                    }}
                    className={`grid aspect-square place-items-center rounded-md border transition hover:bg-accent ${
                      icon === value ? "border-primary bg-accent" : "border-transparent"
                    }`}
                  >
                    <BlockIcon name={icon} className="size-4" />
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-muted-foreground"
          >
            Убрать
          </Button>
        )}
      </div>
    </div>
  );
};
