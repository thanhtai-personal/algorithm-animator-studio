"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { useSalesPosPage } from "@/features/sales/hooks/useSalesPosPage";
import { SALES_POS_CART_PANEL_DETACHED_KEY } from "./constants";
import { SalesPosDetachedCartPanel } from "./SalesPosDetachedCartPanel";
import { SalesPosOrderPanel } from "./SalesPosOrderPanel";
import { SalesPosPaymentReceiptModal } from "./SalesPosPaymentReceiptModal";
import { SalesPosProductBrowser } from "./SalesPosProductBrowser";
import { SalesPosResizeHandle } from "./SalesPosResizeHandle";
import { useResizableOrderPanelWidth } from "./useResizableOrderPanelWidth";
import type { SalesPosPageProps } from "./types";

export const SalesPosPage = observer(function SalesPosPage({
  locale,
  forcedBranch = null,
}: SalesPosPageProps) {
  const model = useSalesPosPage(locale, { forcedBranch });
  const {
    orderPanelWidth,
    orderPanelMinWidth,
    orderPanelMaxWidth,
    isResizingOrderPanel,
    onResizeHandlePointerDown,
    onResizeHandleKeyDown,
  } = useResizableOrderPanelWidth();
  const [inlineCreateError, setInlineCreateError] = useState<string | null>(null);
  const [isCartPanelDetached, setIsCartPanelDetached] = useState(false);
  const resizeHandleAriaLabel =
    locale === "vi"
      ? "Kéo để thay đổi độ rộng phần tạo đơn"
      : "Drag to resize order panel width";
  const detachCartLabel = locale === "vi" ? "Tách khỏi form" : "Detach from form";
  const attachCartLabel = locale === "vi" ? "Đưa vào form" : "Attach to form";
  const detachedCartTitle = locale === "vi" ? "Sản phẩm đã chọn" : "Selected products";
  const floatingToggleLabel = isCartPanelDetached ? attachCartLabel : detachCartLabel;
  const orderPanelStyle = {
    "--sales-pos-order-panel-width": `${orderPanelWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SALES_POS_CART_PANEL_DETACHED_KEY);
    setIsCartPanelDetached(raw === "1");
  }, []);

  const toggleCartPanelDetached = useCallback(() => {
    setIsCartPanelDetached((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SALES_POS_CART_PANEL_DETACHED_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  return (
    <section
      className={`flex min-h-[calc(100vh-6.5rem)] flex-col lg:h-[calc(100vh-6.5rem)] lg:flex-row ${
        isResizingOrderPanel ? "cursor-col-resize select-none" : ""
      }`}
    >
      <SalesPosProductBrowser locale={locale} model={model} forcedBranch={forcedBranch} />
      <SalesPosResizeHandle
        ariaLabel={resizeHandleAriaLabel}
        minWidth={orderPanelMinWidth}
        maxWidth={orderPanelMaxWidth}
        width={orderPanelWidth}
        onPointerDown={onResizeHandlePointerDown}
        onKeyDown={onResizeHandleKeyDown}
      />
      <SalesPosDetachedCartPanel
        locale={locale}
        model={model}
        detached={isCartPanelDetached}
        title={detachedCartTitle}
      />
      <SalesPosOrderPanel
        locale={locale}
        model={model}
        orderPanelStyle={orderPanelStyle}
        isCartPanelDetached={isCartPanelDetached}
        floatingToggleLabel={floatingToggleLabel}
        toggleCartPanelDetached={toggleCartPanelDetached}
        inlineCreateError={inlineCreateError}
        setInlineCreateError={setInlineCreateError}
      />
      <SalesPosPaymentReceiptModal locale={locale} model={model} />
    </section>
  );
});
