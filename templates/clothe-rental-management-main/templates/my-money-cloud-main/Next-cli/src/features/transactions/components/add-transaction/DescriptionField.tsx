"use client";

import { Textarea } from "@/components/ui/textarea";

type DescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
};

export function DescriptionField({ value, onChange, label, placeholder }: DescriptionFieldProps) {
  return (
    <div className="animate-slide-up space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="rounded-none min-h-[96px] resize-none"
        />
      </div>
    </div>
  );
}
