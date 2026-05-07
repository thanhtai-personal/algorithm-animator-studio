import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown } from "lucide-react";

import type { DateRange } from "react-day-picker";

interface StatsFiltersRowProps {
  t: (key: string) => string;
  listRange?: DateRange;
  setListRange: (value: DateRange | undefined) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: ((ids: string[]) => void) | React.Dispatch<React.SetStateAction<string[]>>;
  categoryOptions: Array<{ id: string; name: string }>;
  selectedCategoryLabel: string;
  renderRangePicker: (
    range: DateRange | undefined,
    onChange: (value: DateRange | undefined) => void
  ) => React.ReactNode;
}

export function StatsFiltersRow(props: StatsFiltersRowProps) {
  const {
    t,
    listRange,
    setListRange,
    selectedCategoryIds,
    setSelectedCategoryIds,
    categoryOptions,
    selectedCategoryLabel,
    renderRangePicker,
  } = props;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {renderRangePicker(listRange, setListRange)}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const now = new Date();
            setListRange({
              from: startOfWeek(now, { weekStartsOn: 1 }),
              to: endOfWeek(now, { weekStartsOn: 1 }),
            });
          }}
        >
          📅 {t("stats.thisWeek") || "This Week"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const now = new Date();
            setListRange({
              from: startOfMonth(now),
              to: endOfMonth(now),
            });
          }}
        >
          📆 {t("stats.thisMonth") || "This Month"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const now = new Date();
            setListRange({
              from: startOfYear(now),
              to: endOfYear(now),
            });
          }}
        >
          📊 {t("stats.thisYear") || "This Year"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[180px]">
              <span className="truncate">{selectedCategoryLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("stats.searchCategory") || "Search category..."} />
              <CommandList>
                <CommandEmpty>{t("stats.noCategory") || "No category found"}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedCategoryIds(["all"]);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={selectedCategoryIds.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedCategoryIds(["all"]);
                      }}
                    />
                    <span className="flex-1">{t("categories.all")}</span>
                  </CommandItem>
                  {categoryOptions.map((category) => {
                    if (category.id === "all") return null;
                    const isSelected = selectedCategoryIds.includes(category.id);
                    const isAllSelected = selectedCategoryIds.includes("all");
                    return (
                      <CommandItem
                        key={category.id}
                        onSelect={() => {
                          if (typeof setSelectedCategoryIds === "function") {
                            (setSelectedCategoryIds as React.Dispatch<React.SetStateAction<string[]>>)((prev) => {
                              const filtered = prev.filter((id) => id !== "all");
                              if (prev.includes(category.id)) {
                                const updated = filtered.filter((id) => id !== category.id);
                                return updated.length === 0 ? ["all"] : updated;
                              }
                              return [...filtered, category.id];
                            });
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={isSelected && !isAllSelected} onCheckedChange={() => {}} />
                        <span className="flex-1">{category.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => setListRange(undefined)}>
          {t("stats.clearFilter") || "Clear"}
        </Button>
      </div>
    </>
  );
}
