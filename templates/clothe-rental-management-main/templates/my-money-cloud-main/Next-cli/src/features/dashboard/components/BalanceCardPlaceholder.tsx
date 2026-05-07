import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function BalanceCardPlaceholder({ label }: { label: string }) {
  return (
    <Card variant="elevated" className="p-5">
      <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs">{label}</span>
      </div>
    </Card>
  );
}