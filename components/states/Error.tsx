"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty as EmptyRoot,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { extractError } from "@/lib/axios";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = "Не удалось загрузить",
  error,
  description,
  onRetry,
  className,
}: ErrorStateProps) => {
  const message = description ?? (error ? extractError(error) : "Попробуйте обновить страницу");
  return (
    <EmptyRoot className={cn("min-h-[40vh] border border-destructive/30 bg-destructive/5", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Повторить
          </Button>
        </EmptyContent>
      )}
    </EmptyRoot>
  );
};
