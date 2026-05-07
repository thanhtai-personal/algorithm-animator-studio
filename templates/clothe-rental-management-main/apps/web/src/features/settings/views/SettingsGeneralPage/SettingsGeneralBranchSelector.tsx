"use client";

interface SettingsGeneralBranchOption {
  value: string;
  label: string;
}

interface SettingsGeneralBranchSelectorProps {
  label: string;
  value: string | null;
  options: SettingsGeneralBranchOption[];
  disabled: boolean;
  onChange: (value: string | null) => void;
}

export function SettingsGeneralBranchSelector({
  label,
  value,
  options,
  disabled,
  onChange,
}: SettingsGeneralBranchSelectorProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <label className="space-y-1 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          disabled={disabled}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
