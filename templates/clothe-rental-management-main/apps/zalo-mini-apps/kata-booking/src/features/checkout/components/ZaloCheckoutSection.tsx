import { observer } from "mobx-react-lite";
import { useZaloMiniAppCart } from "@/features/cart/hooks/useZaloMiniAppCart";
import { useZaloMiniAppCheckout } from "@/features/checkout/hooks/useZaloMiniAppCheckout";

export const ZaloCheckoutSection = observer(function ZaloCheckoutSection() {
  const cart = useZaloMiniAppCart();
  const checkout = useZaloMiniAppCheckout();

  return (
    <section className="zalo-card">
      <h2>Checkout</h2>
      <p className="muted">
        Draft -&gt; create payment order -&gt; openPayment -&gt; check transaction.
      </p>

      <div className="row between">
        <span>Tong tien tam tinh</span>
        <strong>{cart.subtotalAmount.toLocaleString("vi-VN")} VND</strong>
      </div>

      {cart.items.length === 0 ? (
        <p className="muted">Gio hang dang trong.</p>
      ) : (
        <ul className="plain-list">
          {cart.items.map((item) => (
            <li key={item.productId} className="row between">
              <span>
                {(item.name ?? item.productId).slice(0, 40)} x {item.quantity}
              </span>
              <button type="button" className="ghost" onClick={() => cart.removeItem(item.productId)}>
                Xoa
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="field">
        <span>Ghi chu don nhap</span>
        <textarea
          rows={2}
          value={checkout.orderDraft.note}
          onChange={(event) => checkout.orderDraft.setNote(event.target.value)}
          placeholder="Ghi chu cho don nhap"
        />
      </label>

      <div className="row gap">
        <button
          type="button"
          disabled={checkout.isProcessing || cart.items.length === 0}
          onClick={() => void checkout.checkout()}
        >
          {checkout.isProcessing ? "Dang xu ly..." : "Thanh toan mini app"}
        </button>
        <button type="button" className="ghost" onClick={cart.clear}>
          Xoa gio hang
        </button>
      </div>

      {checkout.paymentOrder ? (
        <p className="muted">External order: {checkout.paymentOrder.externalOrderId}</p>
      ) : null}

      {checkout.transaction ? (
        <p className="badge">Trang thai giao dich: {checkout.transaction.status}</p>
      ) : null}

      {checkout.errorMessage ? <p className="error-text">{checkout.errorMessage}</p> : null}
    </section>
  );
});
