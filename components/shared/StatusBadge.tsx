import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  PRODUCT_STATUS_COLOR,
  PRODUCT_STATUS_LABEL,
} from "@/lib/constants";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant="outline" className={cn("font-normal", ORDER_STATUS_COLOR[status])}>
    {ORDER_STATUS_LABEL[status]}
  </Badge>
);

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge variant="outline" className={cn("font-normal", PAYMENT_STATUS_COLOR[status])}>
    {PAYMENT_STATUS_LABEL[status]}
  </Badge>
);

export const ProductStatusBadge = ({ status }: { status: ProductStatus }) => (
  <Badge variant="outline" className={cn("font-normal", PRODUCT_STATUS_COLOR[status])}>
    {PRODUCT_STATUS_LABEL[status]}
  </Badge>
);
