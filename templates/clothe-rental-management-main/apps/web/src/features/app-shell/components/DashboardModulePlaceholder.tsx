import type { AppLocale } from "@/constants/locale";
import type { DashboardModuleSegment } from "@/features/app-shell/constants";
import { createLocaleTranslator } from "@/utils/i18nMessages";

interface DashboardModulePlaceholderProps {
  locale: AppLocale;
  module: DashboardModuleSegment;
}

type ModuleTitleMap = Record<DashboardModuleSegment, string>;

const MODULE_TITLE_KEYS: ModuleTitleMap = {
  orders: "nav.orders",
  inventory: "nav.inventory",
  products: "nav.products",
  procurement: "nav.procurement",
  media: "nav.media",
  categories: "nav.categories",
  customers: "nav.customers",
  shifts: "nav.shifts",
  payments: "nav.payments",
  calendar: "nav.calendar",
  makeup: "nav.makeup",
  reports: "nav.reports",
  settings: "nav.settings",
};

export function DashboardModulePlaceholder({
  locale,
  module,
}: DashboardModulePlaceholderProps) {
  const t = createLocaleTranslator(locale);

  return (
    <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md md:p-7">
      <p className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {t("modulePlaceholder.badge")}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        {t(MODULE_TITLE_KEYS[module])}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {t("modulePlaceholder.description")}
      </p>
    </section>
  );
}
