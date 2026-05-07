import { CalendarDays, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import type { DateRange } from "react-day-picker";

interface StatsRangePickerProps {
  range?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  displayLabel: string;
}

export function StatsRangePicker({ range, onChange, displayLabel }: StatsRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[220px] justify-between text-left font-normal",
            !range?.from && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {range?.from ? displayLabel : "All time"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={onChange}
          defaultMonth={range?.from ?? new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
