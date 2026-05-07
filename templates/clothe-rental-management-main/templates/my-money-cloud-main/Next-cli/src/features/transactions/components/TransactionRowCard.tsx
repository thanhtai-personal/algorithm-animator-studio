"use client";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { Edit, Trash2 } from "lucide-react";

interface TransactionRowCardProps {
  description: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  timeLabel: string;
  amountLabel: string;
  isIncome: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel: string;
  deleteLabel: string;
}

export function TransactionRowCard({
  description,
  categoryName,
  categoryIcon,
  categoryColor,
  timeLabel,
  amountLabel,
  isIncome,
  onClick,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: TransactionRowCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-2xl border p-3",
        isIncome
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
          : "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
        onClick && "cursor-pointer transition-all duration-200 hover:scale-y-[1.01]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CategoryIcon icon={categoryIcon} color={categoryColor} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{description}</p>
          <p className="text-xs text-muted-foreground">
            {categoryName} • {timeLabel}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-2">
          <p className={cn("text-sm font-bold", isIncome ? "text-success" : "text-foreground")}>
            {amountLabel}
          </p>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                size="icon"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                aria-label={editLabel}
                title={editLabel}
                className="h-6 w-6"
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">{editLabel}</span>
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                aria-label={deleteLabel}
                title={deleteLabel}
                className="h-6 w-6"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{deleteLabel}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
