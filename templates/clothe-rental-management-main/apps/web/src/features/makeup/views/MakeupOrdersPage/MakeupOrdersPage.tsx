"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupOrdersPage } from "@/features/makeup/hooks/useMakeupOrdersPage";
import { MakeupOrdersTabSection } from "@/features/makeup/components/MakeupOrdersTabSection";
import { MakeupPurchaseInvoicesTabSection } from "@/features/makeup/components/MakeupPurchaseInvoicesTabSection";

interface MakeupOrdersPageProps {
  locale: AppLocale;
}

export const MakeupOrdersPage = observer(function MakeupOrdersPage({
  locale,
}: MakeupOrdersPageProps) {
  const model = useMakeupOrdersPage(locale);
  if (!model.canManage) return null;

  const isLoading =
    model.activeTab === "makeup-orders"
      ? !model.ordersQuery.data && model.ordersQuery.isLoading
      : !model.purchaseInvoicesQuery.data && model.purchaseInvoicesQuery.isLoading;
  const isError =
    model.activeTab === "makeup-orders"
      ? !model.ordersQuery.data && model.ordersQuery.isError
      : !model.purchaseInvoicesQuery.data && model.purchaseInvoicesQuery.isError;

  if (isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() =>
            model.activeTab === "makeup-orders"
              ? void model.ordersQuery.refetch()
              : void model.purchaseInvoicesQuery.refetch()
          }
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {model.copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <nav className="inline-flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => model.setActiveTab("makeup-orders")}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            model.activeTab === "makeup-orders"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {locale === "vi" ? "Đơn makeup" : "Makeup orders"}
        </button>
        <button
          type="button"
          onClick={() => model.setActiveTab("purchase-invoices")}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            model.activeTab === "purchase-invoices"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {locale === "vi" ? "Hóa đơn nhập hàng" : "Purchase invoices"}
        </button>
      </nav>

      {model.activeTab === "makeup-orders" ? (
        <MakeupOrdersTabSection locale={locale} model={model} />
      ) : (
        <MakeupPurchaseInvoicesTabSection locale={locale} model={model} />
      )}
    </section>
  );
});
