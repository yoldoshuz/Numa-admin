"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataPaginationProps {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}

export const DataPagination = ({ page, pages, total, onChange }: DataPaginationProps) => {
  if (pages <= 1) {
    return (
      <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
        <span>Всего: {total}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2">
      <span className="text-sm text-muted-foreground">
        Страница {page} из {pages} · всего {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Вперёд
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
