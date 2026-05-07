"use client";

import {
  ITEM_STATUS_LABEL_KEYS,
  ORDER_STATUS_LABEL_KEYS,
  PAYMENT_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import type {
  ItemStatus,
  OrderStatus,
  PaymentStatus,
} from "@/types/domainPrimitives";
import { cn } from "@/utils/className";

const ITEM_STATUS_STYLES: Record<ItemStatus, string> = {
  READY: "bg-success/15 text-success",
  RESERVED: "bg-warning/15 text-warning",
  ON_RENT: "bg-primary/15 text-primary",
  LAUNDRY: "bg-secondary text-secondary-foreground",
  MAINTENANCE: "bg-orange-500/15 text-orange-600",
  DAMAGED: "bg-destructive/15 text-destructive",
  LOST: "bg-muted text-muted-foreground",
  SOLD: "bg-indigo-500/15 text-indigo-700",
  RETIRED: "bg-muted text-muted-foreground",
};

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  RESERVED: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  PICKED_UP: "bg-primary/20 text-primary",
  RETURNED: "bg-warning/15 text-warning",
  DEBT: "bg-destructive/15 text-destructive",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  POSTED: "bg-success/15 text-success",
  VOIDED: "bg-destructive/15 text-destructive",
};

function toReadableStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type LabelResolver = (labelKey: string, fallbackLabel: string) => string;

interface BaseBadgeProps {
  className?: string;
  labelResolver?: LabelResolver;
}

interface ItemStatusBadgeProps extends BaseBadgeProps {
  kind: "item";
  status: ItemStatus;
  labels?: Partial<Record<ItemStatus, string>>;
}

interface OrderStatusBadgeProps extends BaseBadgeProps {
  kind: "order";
  status: OrderStatus;
  labels?: Partial<Record<OrderStatus, string>>;
}

interface PaymentStatusBadgeProps extends BaseBadgeProps {
  kind: "payment";
  status: PaymentStatus;
  labels?: Partial<Record<PaymentStatus, string>>;
}

type StatusBadgeProps =
  | ItemStatusBadgeProps
  | OrderStatusBadgeProps
  | PaymentStatusBadgeProps;

const BASE_BADGE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "item") {
    const fallbackLabel = toReadableStatus(props.status);
    const label =
      props.labels?.[props.status] ??
      props.labelResolver?.(ITEM_STATUS_LABEL_KEYS[props.status], fallbackLabel) ??
      fallbackLabel;

    return (
      <span
        className={cn(
          BASE_BADGE_CLASS,
          ITEM_STATUS_STYLES[props.status],
          props.className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  if (props.kind === "order") {
    const fallbackLabel = toReadableStatus(props.status);
    const label =
      props.labels?.[props.status] ??
      props.labelResolver?.(ORDER_STATUS_LABEL_KEYS[props.status], fallbackLabel) ??
      fallbackLabel;

    return (
      <span
        className={cn(
          BASE_BADGE_CLASS,
          ORDER_STATUS_STYLES[props.status],
          props.className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  const fallbackLabel = toReadableStatus(props.status);
  const label =
    props.labels?.[props.status] ??
    props.labelResolver?.(PAYMENT_STATUS_LABEL_KEYS[props.status], fallbackLabel) ??
    fallbackLabel;

  return (
    <span
      className={cn(
        BASE_BADGE_CLASS,
        PAYMENT_STATUS_STYLES[props.status],
        props.className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
