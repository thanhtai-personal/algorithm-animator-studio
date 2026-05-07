"use client";

import { CalendarDays, ChevronsUpDown, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils";
import type { CategoryRow } from "@/features/categories/types";

type TransactionFiltersProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  onClearDate: () => void;
  formatRangeValue: (range: DateRange) => string;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: CategoryRow[];
  onOpenAdd: () => void;
};

export function TransactionFilters({
  t,
  dateRange,
  onDateChange,
  onClearDate,
  formatRangeValue,
  selectedCategory,
  onCategoryChange,
  categories,
  onOpenAdd,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-3">
        <Button
          size="icon"
          variant="outline"
          onClick={onOpenAdd}
          aria-label={t("addTransaction.title")}
          title={t("addTransaction.title")}
          className="h-6 w-6"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{t("addTransaction.title")}</span>
        </Button>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold">
          {t("stats.rangeStart")} - {t("stats.rangeEnd")}
        </label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("flex-1 justify-between text-left font-normal", !dateRange?.from && "text-muted-foreground")}
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {dateRange?.from ? formatRangeValue(dateRange) : t("stats.rangeAll")}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={dateRange}
                onSelect={onDateChange}
                defaultMonth={dateRange?.from ?? new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button type="button" variant="outline" onClick={onClearDate} disabled={!dateRange}>
            {t("common.clear")}
          </Button>
        </div>
      </div>
      <div className="flex justify-start sm:justify-end">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 w-full sm:w-64">
            <SelectValue placeholder={t("transactions.filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.all")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
