"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ClipboardCheck } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { ReturnOrderModal } from "@/features/orders/components/ReturnOrderModal";

interface SalesReturnsPageProps {
  locale: AppLocale;
}

interface SalesReturnsCopy {
  title: string;
  description: string;
  openModalAction: string;
  hint: string;
}

const SALES_RETURNS_COPY: Record<AppLocale, SalesReturnsCopy> = {
  vi: {
    title: "Đơn trả hàng tại POS",
    description:
      "Tab POS đã dùng cùng quy trình đơn trả với Dashboard để đảm bảo đủ thông tin trả hàng, thu thêm, hoàn cọc và trạng thái đơn trả.",
    openModalAction: "Mở đơn trả hàng",
    hint: "Nếu cần tiếp tục xử lý, mở lại modal đơn trả hàng.",
  },
  en: {
    title: "POS Return Orders",
    description:
      "POS now uses the same return-order workflow as Dashboard to keep full return details, extra collection, deposit refund, and return statuses.",
    openModalAction: "Open return order",
    hint: "Re-open the return-order modal whenever you need to continue processing.",
  },
};

export const SalesReturnsPage = observer(function SalesReturnsPage({
  locale,
}: SalesReturnsPageProps) {
  const copy = SALES_RETURNS_COPY[locale];
  const [returnModalOpen, setReturnModalOpen] = useState(true);

  return (
    <section className="flex min-h-[calc(100vh-6.5rem)] items-start justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground md:text-xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{copy.description}</p>
          </div>

          <button
            type="button"
            onClick={() => setReturnModalOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {copy.openModalAction}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <p>{copy.hint}</p>
        </div>
      </div>

      <ReturnOrderModal
        locale={locale}
        open={returnModalOpen}
        onOpenChange={setReturnModalOpen}
      />
    </section>
  );
});
