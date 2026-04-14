import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  Empty as EmptyRoot,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const Empty = ({
  title = "Пока ничего нет",
  description = "Здесь появятся данные, как только они будут добавлены.",
  icon,
  action,
  className,
}: EmptyProps) => {
  return (
    <EmptyRoot className={cn("min-h-[40vh] border bg-card/30", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary">
          {icon ?? <Inbox className="size-5" />}
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </EmptyRoot>
  );
};
