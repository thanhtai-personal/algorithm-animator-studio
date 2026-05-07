export const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: "border-border bg-muted/30 text-muted-foreground",
  CREATED: "border-primary/30 bg-primary/10 text-primary",
  RETURN_SETTLED: "border-warning/40 bg-warning/10 text-warning",
  COMPLETED: "border-success/40 bg-success/10 text-success",
  CANCELLED: "border-destructive/40 bg-destructive/10 text-destructive",
  PENDING: "border-warning/40 bg-warning/10 text-warning",
  REFUNDED: "border-success/40 bg-success/10 text-success",
  NOT_REQUIRED: "border-border bg-muted/30 text-muted-foreground",
};
