import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  CircleDollarSign,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { ZaloAuthCard } from "@/features/auth/components/ZaloAuthCard";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { RentalOrderFormSteps } from "@/features/rental-order/components/form-steps";
import { ActiveOrdersPage } from "@/features/rental-order/components/ActiveOrdersPage";
import { useRentalOrderPage } from "@/features/rental-order/hooks/useRentalOrderPage";

function formatMoney(value: number | null | undefined): string {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function normalizeMoneyInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

function formatMoneyInput(value: string): string {
  if (!value) return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return new Intl.NumberFormat("vi-VN").format(numericValue);
}

function parseMoneyInput(value: string): string {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return "-";
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return value;
  return `${matched[3]}/${matched[2]}/${matched[1]}`;
}

function resolveImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return null;
}

export const RentalOrderSection = observer(function RentalOrderSection() {
  const model = useRentalOrderPage();
  const { store } = model;
  const isSubmitting = model.createOrderMutation.isPending;
  const isProductLoading =
    model.productsQuery.isLoading ||
    (model.productsQuery.isFetching && store.productResults.length === 0);
  const createdSummary = store.createOrderSuccessSummary;
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null);
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"POS" | "RETURNS" | "SURCHARGE">("POS");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const switchActiveView = (view: "POS" | "RETURNS" | "SURCHARGE") => {
    if (view === activeView) return;

    const order = ["POS", "RETURNS", "SURCHARGE"];
    setSlideDirection(order.indexOf(view) > order.indexOf(activeView) ? "right" : "left");
    if (view !== "POS") {
      model.quickVoice.abort();
    }
    setActiveView(view);
  };

  if (!zaloMiniAppAuthStore.isAuthenticated) {
    return (
      <section className="booking-layout">
        <ZaloAuthCard />
      </section>
    );
  }

  if (model.accessQuery.isLoading && !store.access) {
    return (
      <section className="booking-layout">
        <p className="muted">Đang tải quyền truy cập...</p>
      </section>
    );
  }

  if (model.accessQuery.isError && !store.access) {
    return (
      <section className="booking-layout">
        <section className="zalo-card error">
          <p className="error-text">Không tải được quyền truy cập và danh sách chi nhánh.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="booking-layout">
      <div className="dashboard-quick-bar">
        <div className="dashboard-quick-bar-inner">
          <button
            type="button"
            className={
              activeView === "POS" ? "dashboard-quick-button is-active" : "dashboard-quick-button"
            }
            onClick={() => switchActiveView("POS")}
          >
            <span
              className={
                activeView === "POS"
                  ? "dashboard-quick-button-icon is-active"
                  : "dashboard-quick-button-icon"
              }
            >
              <ShoppingCart className="icon" />
            </span>
            <span className="dashboard-quick-button-label">POS</span>
          </button>
          <button
            type="button"
            className={
              activeView === "RETURNS" ? "dashboard-quick-button is-active" : "dashboard-quick-button"
            }
            onClick={() => switchActiveView("RETURNS")}
          >
            <span
              className={
                activeView === "RETURNS"
                  ? "dashboard-quick-button-icon is-active"
                  : "dashboard-quick-button-icon"
              }
            >
              <RotateCcw className="icon" />
            </span>
            <span className="dashboard-quick-button-label">Trả hàng</span>
          </button>
          <button
            type="button"
            className={
              activeView === "SURCHARGE" ? "dashboard-quick-button is-active" : "dashboard-quick-button"
            }
            onClick={() => switchActiveView("SURCHARGE")}
          >
            <span
              className={
                activeView === "SURCHARGE"
                  ? "dashboard-quick-button-icon is-active"
                  : "dashboard-quick-button-icon"
              }
            >
              <CircleDollarSign className="icon" />
            </span>
            <span className="dashboard-quick-button-label">Phụ thu/chi</span>
          </button>
        </div>
      </div>

      <div className="dashboard-page-stage">
        <div key={`${activeView}-${slideDirection}`} className={`dashboard-page-panel slide-${slideDirection}`}>
          {activeView === "POS" ? (
        <>
          {store.createOrderSuccessMessage ? (
            <section className="zalo-card success-card">
          <div className="section-head section-head-mobile-stack">
            <div>
              <h2>
                {createdSummary?.orderType === "SALE"
                  ? "Tạo đơn bán thành công"
                  : "Tạo đơn thuê thành công"}
              </h2>
              <p className="muted">{store.createOrderSuccessMessage}</p>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => store.setCreateOrderSuccess(null)}
            >
              Đóng
            </button>
          </div>

          {createdSummary ? (
            <div className="success-review-grid">
              <p className="muted">
                Mã đơn: <strong>{createdSummary.orderCode || "-"}</strong>
              </p>
              <p className="muted">
                Khách hàng: <strong>{createdSummary.customer.fullName || "-"}</strong>
              </p>
              <p className="muted">
                Số lượng SP: <strong>{createdSummary.itemCount}</strong>
              </p>
              <p className="muted">
                Tổng tiền: <strong>{formatMoney(createdSummary.money.totalAmount)}</strong>
              </p>
              {createdSummary.orderType === "RENTAL" ? (
                <>
                  <p className="muted">
                    Giá cọc: <strong>{formatMoney(createdSummary.money.depositAmount)}</strong>
                  </p>
                  <p className="muted">
                    Thời gian:{" "}
                    <strong>
                      {formatDateDisplay(createdSummary.startDate)} {createdSummary.pickupTime ?? "--:--"} -{" "}
                      {formatDateDisplay(createdSummary.endDate)} {createdSummary.returnTime ?? "--:--"}
                    </strong>
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <fieldset className="form-lock-fieldset" disabled={isSubmitting}>
        <section className="order-type-tabs" aria-label="Loại đơn hàng">
          <button
            type="button"
            className={`order-type-tab ${store.orderType === "RENTAL" ? "is-active" : ""}`}
            aria-pressed={store.orderType === "RENTAL"}
            onClick={() => store.setOrderType("RENTAL")}
          >
            Đơn thuê
          </button>
          <button
            type="button"
            className={`order-type-tab ${store.orderType === "SALE" ? "is-active" : ""}`}
            aria-pressed={store.orderType === "SALE"}
            onClick={() => store.setOrderType("SALE")}
          >
            Đơn bán
          </button>
        </section>

        <RentalOrderFormSteps currentStep={store.currentStep} onStepChange={store.setCurrentStep}>
        <RentalOrderFormSteps.Steps>
          <RentalOrderFormSteps.Step step={1} label="Chọn sản phẩm">
            <section className="zalo-card">
          <div className="section-head">
            <div>
              <h2>Chọn sản phẩm</h2>
              <p className="muted">
                {store.orderType === "SALE"
                  ? "Chọn sản phẩm cho đơn bán, tăng giảm số lượng ngay trong giỏ."
                  : "Chọn sản phẩm giống flow POS, tăng giảm số lượng ngay trong giỏ."}
              </p>
            </div>
            <span className="badge">{model.cartProducts.length} loại</span>
          </div>

          <label className="field">
            <span>Tìm sản phẩm</span>
            <input
              value={store.productSearch}
              onChange={(event) => store.setProductSearch(event.target.value)}
              placeholder="Mã sản phẩm, tên sản phẩm"
            />
          </label>

          <label className="field">
            <span>
              Chi nhánh<span className="required-mark">*</span>
            </span>
            <select
              value={store.branchId ?? ""}
              onChange={(event) => store.setBranchId(event.target.value)}
              disabled={!store.access || store.access.branches.length === 0}
            >
              {store.access?.branches.length ? (
                store.access.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              ) : (
                <option value="">Đang tải chi nhánh...</option>
              )}
            </select>
          </label>

          <div className="product-pos-layout">
            <div className="product-pos-grid">
              {isProductLoading ? (
                <div className="empty-card product-loading-card">Đang tải danh sách sản phẩm...</div>
              ) : null}

              {!isProductLoading && store.productResults.length === 0 ? (
                <div className="empty-card">Không có sản phẩm phù hợp.</div>
              ) : null}

              {model.productsQuery.isFetching && store.productResults.length > 0 ? (
                <p className="muted product-loading-hint">Đang cập nhật danh sách sản phẩm...</p>
              ) : null}

              {store.productResults.map((product) => {
                const selectedCount = store.getSelectedCountForProduct(product.id);
                const imageUrl = resolveImageUrl(product.coverImagePath);
                const sizeLabel = product.sizes?.join(", ") || "Mặc định";
                const unitPrice =
                  store.orderType === "SALE"
                    ? product.salePrice ?? 0
                    : store.pricingMode === "QUICK"
                      ? product.quickRentPrice ??
                        product.rentPricePerDay ??
                        product.pricePolicy.pricePerDay ??
                        product.pricePolicy.price1d ??
                        0
                      : product.rentPricePerDay ??
                        product.pricePolicy.pricePerDay ??
                        product.pricePolicy.price1d ??
                        0;
                const depositAmount =
                  product.rentDepositAmount ?? product.pricePolicy.defaultDepositAmount ?? 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    className="product-card"
                    onClick={() => void model.addProductToCart(product)}
                  >
                    <div className="product-card-media">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} />
                      ) : (
                        <span>{product.productCode}</span>
                      )}
                    </div>
                    <div className="product-card-body">
                      <strong>
                        {product.name} - {product.productCode} ({product.readyItems})
                      </strong>
                      <span className="muted">Size: {sizeLabel}</span>
                      <span className="muted">
                        Loại - {product.categoryName ?? "Chưa phân loại"}
                      </span>
                      <span className="muted">
                        {store.orderType === "SALE"
                          ? "Giá bán"
                          : store.pricingMode === "QUICK"
                            ? "Giá thuê nhanh"
                            : "Giá thuê tiêu chuẩn"}: {formatMoney(unitPrice)}
                      </span>
                      {store.orderType === "RENTAL" ? (
                        <span className="muted">Giá cọc: {formatMoney(depositAmount)}</span>
                      ) : null}
                    </div>
                    {selectedCount > 0 ? (
                      <span className="badge success">Đã chọn {selectedCount}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <aside className="cart-panel">
              <div className="cart-panel-head">
                <h3>Giỏ sản phẩm</h3>
                <span className="badge">{model.cartProducts.length} loại</span>
              </div>

              {model.cartProducts.length === 0 ? (
                <div className="empty-card">
                  <ShoppingCart className="empty-card-icon" />
                  <p>Chưa có sản phẩm trong giỏ.</p>
                </div>
              ) : (
                <div className="cart-list">
                  {model.cartProducts.map((item) => (
                    <article key={item.productId} className="cart-card">
                      <div className="cart-card-head">
                        <div>
                          <strong>{item.productName}</strong>
                          <p className="muted">
                            {item.productCode} · {item.variantNames.join(", ") || "Mặc định"}
                          </p>
                          <p className="muted">
                            Đơn giá: {formatMoney(item.unitPrice)} · Tối đa: {item.maxQuantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="icon-ghost-button"
                          onClick={() => model.removeProductFromCart(item.productId)}
                          aria-label="Xóa sản phẩm khỏi giỏ"
                        >
                          <Trash2 className="icon" />
                        </button>
                      </div>

                      <div className="cart-card-footer">
                        <div className="quantity-stepper">
                          <button
                            type="button"
                            className="icon-ghost-button"
                            onClick={() => model.decreaseProductQuantity(item.productId)}
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="icon" />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            className="icon-ghost-button"
                            onClick={() => void model.increaseProductQuantity(item.productId)}
                            disabled={item.quantity >= item.maxQuantity}
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="icon" />
                          </button>
                        </div>
                        <strong>{formatMoney(item.lineTotal)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="cart-summary">
                <div className="row between">
                  <span className="muted">Tạm tính</span>
                  <strong>{formatMoney(model.subtotalAmount)}</strong>
                </div>
                {store.orderType === "RENTAL" ? (
                  <div className="row between">
                    <span className="muted">Giá cọc</span>
                    <strong>{formatMoney(model.suggestedDepositAmount)}</strong>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
            </section>
          </RentalOrderFormSteps.Step>

          <RentalOrderFormSteps.Step
            step={2}
            label="Khách hàng và đơn"
            disabled={!store.canProceedToCustomerStep}
          >
            <>
              <section className="zalo-card">
            <div className="section-head section-head-mobile-stack">
              <div>
                <h2>Khách hàng và thông tin đơn</h2>
                <p className="muted">Chọn khách hàng, có thể tạo nhanh khách mới, rồi hoàn tất thông tin đơn.</p>
              </div>
            </div>

            <div className="selected-summary-list">
              {model.cartProducts.map((item) => (
                <div key={item.productId} className="summary-chip">
                  <strong>{item.productName}</strong>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="zalo-card">
            <h2>Khách hàng</h2>
            <label className="field">
              <span>
                Tìm khách hàng
                {store.orderType === "RENTAL" ? <span className="required-mark">*</span> : null}
              </span>
              <input
                value={store.customerSearch}
                onChange={(event) => {
                  setQuickCreateError(null);
                  store.setCustomerSearch(event.target.value);
                }}
                placeholder="Nhập tên hoặc số điện thoại"
              />
            </label>

            {store.selectedCustomer ? (
              <div className="selection-card">
                <strong>{store.selectedCustomer.fullName}</strong>
                <span className="muted">
                  {store.selectedCustomer.phone ?? "Không có số điện thoại"}
                </span>
                <button type="button" className="ghost" onClick={store.clearCustomer}>
                  Bỏ chọn
                </button>
              </div>
            ) : null}

            <div className="grid-list">
              {store.customerResults.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="list-option"
                  onClick={() => {
                    setQuickCreateError(null);
                    store.selectCustomer(customer);
                  }}
                >
                  <strong>{customer.fullName}</strong>
                  <span>{customer.phone ?? "Không có SĐT"}</span>
                </button>
              ))}
            </div>

            {model.canQuickCreateCustomer && !store.quickCustomerOpen ? (
              <div className="quick-create-card">
                <p className="muted">Không tìm thấy khách phù hợp. Có thể tạo nhanh bằng tên và số điện thoại.</p>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setQuickCreateError(null);
                    store.openQuickCustomerCreate();
                  }}
                >
                  Tạo nhanh khách hàng
                </button>
              </div>
            ) : null}

            {store.quickCustomerOpen ? (
              <div className="quick-create-card">
                <label className="field">
                  <span>
                    Họ tên khách hàng<span className="required-mark">*</span>
                  </span>
                  <input
                    value={store.quickCustomerFullName}
                    onChange={(event) => store.setQuickCustomerFullName(event.target.value)}
                    placeholder="Nhập họ tên"
                  />
                </label>

                <label className="field">
                  <span>
                    Số điện thoại<span className="required-mark">*</span>
                  </span>
                  <input
                    value={store.quickCustomerPhone}
                    onChange={(event) => store.setQuickCustomerPhone(event.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </label>

                {quickCreateError ? <p className="error-text">{quickCreateError}</p> : null}

                <div className="step-actions">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setQuickCreateError(null);
                        await model.createQuickCustomer();
                      } catch (error) {
                        setQuickCreateError(
                          error instanceof Error ? error.message : "Không thể tạo khách hàng"
                        );
                      }
                    }}
                    disabled={model.createCustomerMutation.isPending}
                  >
                    {model.createCustomerMutation.isPending ? "Đang tạo..." : "Tạo khách hàng"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setQuickCreateError(null);
                      store.closeQuickCustomerCreate();
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="zalo-card">
            <h2>Thông tin đơn</h2>

            <div className="form-grid">
              {store.orderType === "RENTAL" ? (
                <>
                  <label className="field">
                    <span>
                      Loại giá thuê<span className="required-mark">*</span>
                    </span>
                    <select
                      value={store.pricingMode}
                      onChange={(event) =>
                        store.setPricingMode(
                          event.target.value === "QUICK" ? "QUICK" : "STANDARD"
                        )
                      }
                    >
                      <option value="STANDARD">Giá thuê tiêu chuẩn (3 ngày)</option>
                      <option value="QUICK">Giá thuê nhanh (24h)</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>
                      Ngày bắt đầu<span className="required-mark">*</span>
                    </span>
                    <input
                      type="date"
                      value={store.startDate}
                      disabled
                    />
                  </label>

                  <label className="field">
                    <span>
                      Ngày kết thúc<span className="required-mark">*</span>
                    </span>
                    <input
                      type="date"
                      value={store.endDate}
                      disabled
                    />
                  </label>

                  <label className="field">
                    <span>Giờ nhận đồ</span>
                    <input
                      type="time"
                      value={store.pickupTime}
                      disabled
                    />
                  </label>

                  <label className="field">
                    <span>Giờ trả đồ</span>
                    <input
                      type="time"
                      value={store.returnTime}
                      disabled
                    />
                  </label>

                  <label className="field">
                    <span>Tiền cọc</span>
                    <input
                      value={formatMoneyInput(store.depositAmount)}
                      onChange={(event) =>
                        store.setDepositAmount(normalizeMoneyInput(event.target.value))
                      }
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </label>
                </>
              ) : null}

              <label className="field">
                <span>
                  {store.orderType === "SALE"
                    ? "Giá bán"
                    : store.pricingMode === "QUICK"
                      ? "Giá thuê nhanh"
                      : "Giá thuê tiêu chuẩn"}
                </span>
                <input
                  value={formatMoneyInput(store.collectedAmount)}
                  onChange={(event) =>
                    store.setCollectedAmount(normalizeMoneyInput(event.target.value))
                  }
                  inputMode="numeric"
                  placeholder="0"
                />
              </label>
            </div>

            <label className="field">
              <span>Phương thức thu tiền</span>
              <select
                value={store.receiptMethod}
                onChange={(event) =>
                  store.setReceiptMethod(event.target.value === "BANK" ? "BANK" : "CASH")
                }
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK">Chuyển khoản</option>
              </select>
            </label>

            <label className="field">
              <span>Ghi chú</span>
              <textarea
                value={store.note}
                onChange={(event) => store.setNote(event.target.value)}
                rows={4}
              />
            </label>

          </section>

            </>
          </RentalOrderFormSteps.Step>
        </RentalOrderFormSteps.Steps>

        <RentalOrderFormSteps.Footer>
          {({ currentStep, isFirstStep, goNext, goPrev }) =>
            currentStep === 1 ? (
              <button
                type="button"
                className="footer-primary-button"
                onClick={goNext}
                disabled={!store.canProceedToCustomerStep}
              >
                Tiếp tục
              </button>
            ) : (
              <div className="footer-action-stack">
                {model.quickVoice.state === "listening" || model.quickVoice.state === "processing" ? (
                  <div className="footer-voice-feedback" aria-live="polite">
                    {model.quickVoice.state === "listening" ? (
                      <p className="muted">
                        Đang nghe: {model.quickVoice.liveTranscript || "Hãy đọc theo mẫu tên field + nội dung"}
                      </p>
                    ) : (
                      <p className="muted">Đang xử lý transcript để điền form...</p>
                    )}
                  </div>
                ) : null}

                {model.quickVoice.state === "error" && model.quickVoice.error ? (
                  <p className="error-text footer-voice-error">{model.quickVoice.error.message}</p>
                ) : null}
                {model.quickVoiceHint ? (
                  <p className="muted footer-voice-hint">{model.quickVoiceHint}</p>
                ) : null}

                <div className="footer-action-grid">
                  <button
                    type="button"
                    className="ghost footer-secondary-button"
                    onClick={isFirstStep ? undefined : goPrev}
                  >
                    Quay lại
                  </button>
                  <VoiceInputButton
                    state={model.quickVoice.state}
                    onStart={() => void model.quickVoice.start()}
                    onStop={model.quickVoice.stop}
                    disabled={!store.branchId}
                    className="footer-voice-button"
                  />
                  <button
                    type="button"
                    className="footer-primary-button"
                    disabled={
                      (store.orderType === "RENTAL" && !store.selectedCustomer) ||
                      store.selectedItems.length === 0 ||
                      model.createOrderMutation.isPending
                    }
                    onClick={() => void model.submit()}
                  >
                    {model.createOrderMutation.isPending
                      ? "Đang tạo đơn..."
                      : "Tạo đơn"}
                  </button>
                </div>
              </div>
            )
          }
        </RentalOrderFormSteps.Footer>
        </RentalOrderFormSteps>
      </fieldset>
    </>
  ) : activeView === "RETURNS" ? (
    <ActiveOrdersPage model={model} />
  ) : null}
  {activeView === "SURCHARGE" ? (
    <section className="zalo-card">
      <div className="section-head section-head-mobile-stack">
        <div>
          <h2>Phụ thu / phụ chi tại POS</h2>
          <p className="muted">
            Ghi nhận nhanh khoản thu thêm hoặc chi ngoài đơn hàng, đồng bộ báo cáo như POS web.
          </p>
        </div>
      </div>

      <form
        className="manual-payment-form"
        onSubmit={(event) => {
          event.preventDefault();
          setManualPaymentError(null);
          void model.submitManualPayment().then((message) => {
            if (message) {
              setManualPaymentError(message);
            }
          }).catch((error) => {
            setManualPaymentError(error instanceof Error ? error.message : "Không thể tạo giao dịch");
          });
        }}
      >
        <div className="form-grid">
          <label className="field">
            <span>Loại giao dịch</span>
            <select
              value={store.manualPaymentType}
              onChange={(event) =>
                store.setManualPaymentType(event.target.value === "EXPENSE" ? "EXPENSE" : "FEE")
              }
            >
              <option value="FEE">Phụ thu</option>
              <option value="EXPENSE">Phụ chi</option>
            </select>
          </label>

          <label className="field">
            <span>Phương thức</span>
            <select
              value={store.manualPaymentMethod}
              onChange={(event) => {
                const value = event.target.value;
                store.setManualPaymentMethod(
                  value === "BANK" ? "BANK" : value === "MOMO" ? "MOMO" : "CASH"
                );
              }}
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK">Chuyển khoản</option>
              <option value="MOMO">MOMO</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Số tiền</span>
          <input
            value={formatMoneyInput(store.manualPaymentAmount)}
            onChange={(event) =>
              store.setManualPaymentAmount(parseMoneyInput(event.target.value))
            }
            inputMode="numeric"
            placeholder="0"
          />
        </label>

        <label className="field">
          <span>Lý do</span>
          <input
            value={store.manualPaymentReason}
            onChange={(event) => store.setManualPaymentReason(event.target.value)}
            placeholder="Nhập lý do"
          />
        </label>

        <label className="field">
          <span>Ghi chú</span>
          <textarea
            value={store.manualPaymentNote}
            onChange={(event) => store.setManualPaymentNote(event.target.value)}
            rows={3}
          />
        </label>

        {store.manualPaymentType === "EXPENSE" ? (
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={store.manualPaymentIsImportOrder}
              onChange={(event) => store.setManualPaymentIsImportOrder(event.target.checked)}
            />
            <span>Đơn nhập hàng</span>
          </label>
        ) : null}

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={store.manualPaymentIsInitialCapital}
            onChange={(event) => store.setManualPaymentIsInitialCapital(event.target.checked)}
          />
          <span>Vốn ban đầu</span>
        </label>

        {manualPaymentError ? <p className="error-text">{manualPaymentError}</p> : null}

        <button
          type="submit"
          disabled={model.createManualPaymentMutation.isPending}
          className="footer-primary-button"
        >
          {model.createManualPaymentMutation.isPending ? "Đang lưu..." : "Xác nhận"}
        </button>
      </form>

      {store.latestManualPayment ? (
        <div className="selection-card manual-payment-latest">
          <strong>Giao dịch vừa tạo</strong>
          <span className="muted">
            {store.latestManualPayment.type} · {store.latestManualPayment.method} ·{" "}
            {formatMoney(store.latestManualPayment.amount)}
          </span>
          <span className="muted">{store.latestManualPayment.reason ?? "-"}</span>
        </div>
      ) : null}
    </section>
  ) : null}
        </div>
      </div>
    </section>
  );
});
