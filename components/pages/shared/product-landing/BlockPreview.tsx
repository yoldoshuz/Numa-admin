"use client";

import type { BlockData, BlockField } from "@/lib/types";
import { BlockIcon } from "./block-icons";
import { asList, asLocalized, type BlockLanguage } from "./block-meta";

/**
 * What the block says, in one language, laid out roughly the way a storefront
 * lays it out.
 *
 * Deliberately not a pixel preview: the three shops share this backend and
 * nothing else — kids, nutrition and halal each style these sections
 * differently, so a single faithful rendering does not exist. This answers the
 * question a moderator actually has ("did I fill everything in, and does it
 * read right in Uzbek") without pretending to be any of the three designs.
 */
export const BlockPreview = ({
  fields,
  data,
  language,
}: {
  fields: BlockField[] | undefined;
  data: BlockData;
  language: BlockLanguage;
}) => {
  const text = (name: string) => asLocalized(data[name])[language].trim();

  const scalarFields = (fields ?? []).filter((f) => f.kind !== "list");
  const listFields = (fields ?? []).filter((f) => f.kind === "list");

  const badge = text("badge");
  const title = text("title");
  const subtitle = text("subtitle") || text("tagline");
  const body = text("text");

  // Anything the named slots above do not cover — a field the backend added
  // after this component was written still shows up instead of vanishing.
  const covered = new Set(["badge", "title", "subtitle", "tagline", "text"]);
  const extra = scalarFields.filter((f) => !covered.has(f.name) && f.kind === "text");

  const empty =
    !badge &&
    !title &&
    !subtitle &&
    !body &&
    extra.every((f) => !text(f.name)) &&
    listFields.every((f) => asList(data[f.name]).length === 0);

  if (empty) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        На этом языке блок пока пустой
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-background p-5">
      {badge && (
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
      {title && <h3 className="text-lg leading-snug font-semibold">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {body && <p className="text-sm leading-relaxed whitespace-pre-line">{body}</p>}

      {extra.map((field) => {
        const value = text(field.name);
        return value ? (
          <p key={field.name} className="text-sm leading-relaxed">
            {value}
          </p>
        ) : null;
      })}

      {listFields.map((field) => {
        const rows = asList(data[field.name]);
        if (!rows.length) return null;
        return (
          <ol key={field.name} className="space-y-2">
            {rows.map((row, index) => (
              <PreviewRow
                key={index}
                index={index}
                fields={field.fields}
                row={row}
                language={language}
              />
            ))}
          </ol>
        );
      })}
    </div>
  );
};

const PreviewRow = ({
  index,
  fields,
  row,
  language,
}: {
  index: number;
  fields: BlockField[] | undefined;
  row: BlockData;
  language: BlockLanguage;
}) => {
  const text = (name: string) => asLocalized(row[name])[language].trim();
  const has = (name: string) => (fields ?? []).some((f) => f.name === name);

  const icon = typeof row.icon === "string" ? row.icon : "";
  const percent = typeof row.percent === "number" ? row.percent : null;

  // `specs` is a label/value pair; everything else leads with a title or a
  // single line of text.
  const heading = text("title") || text("question") || text("label");
  const detail = text("text") || text("answer") || text("description") || text("value");
  const numbered = has("title") && has("text") && !has("icon") && percent === null;

  return (
    <li className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2">
      {icon ? (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <BlockIcon name={icon} className="size-4" />
        </span>
      ) : numbered ? (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
      ) : null}

      <div className="min-w-0 flex-1 space-y-1">
        {heading && <p className="text-sm font-medium">{heading}</p>}
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
        {percent !== null && (
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-semibold text-primary">{percent}%</span>
          </div>
        )}
        {!heading && !detail && percent === null && (
          <p className="text-sm text-muted-foreground italic">не заполнено</p>
        )}
      </div>
    </li>
  );
};
