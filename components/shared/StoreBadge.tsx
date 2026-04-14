import { Badge } from "@/components/ui/badge";
import { STORES } from "@/lib/constants";
import type { StoreSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StoreBadgeProps {
  store: StoreSlug | null | undefined;
  className?: string;
}

export const StoreBadge = ({ store, className }: StoreBadgeProps) => {
  if (!store) {
    return (
      <Badge variant="outline" className={cn("font-normal", className)}>
        Глобально
      </Badge>
    );
  }
  const meta = STORES.find((s) => s.value === store);
  return (
    <Badge variant="outline" className={cn("font-normal border-0", meta?.color, className)}>
      {meta?.label ?? store}
    </Badge>
  );
};
