"use client";

import { Loader2, User } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import type { SalesPosPageModel } from "./types";

interface SalesPosCustomerPanelProps {
  locale: AppLocale;
  model: SalesPosPageModel;
  inlineCreateError: string | null;
  setInlineCreateError: (value: string | null) => void;
}

export function SalesPosCustomerPanel({
  locale,
  model,
  inlineCreateError,
  setInlineCreateError,
}: SalesPosCustomerPanelProps) {
  const inlineCreateLoadingLabel = locale === "vi" ? "Đang xử lý..." : "Processing...";

  return (
    <div className="space-y-2 border-b border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <User className="h-4 w-4" />
        {model.copy.customerLabel}
      </p>

      {model.selectedCustomer ? (
        <div className="rounded-lg border border-border bg-accent/50 px-3 py-2">
          <p className="text-sm font-semibold text-foreground">{model.selectedCustomer.fullName}</p>
          <p className="text-xs text-muted-foreground">{model.selectedCustomer.phone ?? "-"}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{model.copy.noCustomerHint}</p>
      )}

      <input
        type="search"
        value={model.customerSearch}
        onChange={(event) => model.setCustomerSearch(event.target.value)}
        placeholder={model.copy.customerSearchPlaceholder}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />

      {model.customerOptions.length > 0 ? (
        <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
          {model.customerOptions.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                model.selectCustomer(customer);
                setInlineCreateError(null);
              }}
              className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent/60"
            >
              <span className="font-medium text-foreground">{customer.fullName}</span>
              <span className="text-xs text-muted-foreground">{customer.phone ?? "-"}</span>
            </button>
          ))}
        </div>
      ) : null}

      {model.customerSearch.trim().length >= 2 &&
      !model.customerTypeaheadLoading &&
      model.customerOptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">{model.copy.customerNoResult}</p>
      ) : null}

      {model.canInlineCreateCustomer ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-xs text-muted-foreground">{model.copy.customerPhoneMissHint}</p>
          <button
            type="button"
            onClick={() => {
              setInlineCreateError(null);
              model.toggleInlineCustomerCreate();
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {model.copy.inlineCreateAction}
          </button>
        </div>
      ) : null}

      {model.inlineCustomerOpen ? (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.inlineCreateTitle}
          </p>
          <p className="text-xs text-muted-foreground">{model.copy.inlineCreateHint}</p>
          <InlineCustomerInput
            label={model.copy.inlineFullNameLabel}
            type="text"
            value={model.inlineCustomerDraft.fullName}
            onChange={(value) =>
              model.setInlineCustomerDraft((previous) => ({ ...previous, fullName: value }))
            }
          />
          <InlineCustomerInput
            label={model.copy.inlinePhoneLabel}
            type="tel"
            value={model.inlineCustomerDraft.phone}
            onChange={(value) =>
              model.setInlineCustomerDraft((previous) => ({ ...previous, phone: value }))
            }
          />
          {inlineCreateError ? <p className="text-xs text-destructive">{inlineCreateError}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  setInlineCreateError(null);
                  await model.createInlineCustomer();
                } catch (error) {
                  setInlineCreateError(
                    error instanceof Error ? error.message : model.copy.customerCreateFailed
                  );
                }
              }}
              disabled={model.creatingCustomer}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {model.creatingCustomer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>
                {model.creatingCustomer ? inlineCreateLoadingLabel : model.copy.inlineCreateSubmit}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInlineCreateError(null);
                model.setInlineCustomerOpen(false);
              }}
              className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-accent"
            >
              {model.copy.inlineCreateCancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InlineCustomerInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "text" | "tel";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
      />
    </label>
  );
}
