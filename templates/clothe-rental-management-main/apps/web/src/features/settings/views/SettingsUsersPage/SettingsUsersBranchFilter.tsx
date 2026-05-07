"use client";

interface SettingsUsersBranchOption {
  value: string;
  label: string;
}

interface SettingsUsersBranchFilterProps {
  label: string;
  allBranchesLabel: string;
  value: string;
  options: SettingsUsersBranchOption[];
  onChange: (value: string) => void;
}

export function SettingsUsersBranchFilter({
  label,
  allBranchesLabel,
  value,
  options,
  onChange,
}: SettingsUsersBranchFilterProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <label className="space-y-1 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">{allBranchesLabel}</option>
          {options.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
