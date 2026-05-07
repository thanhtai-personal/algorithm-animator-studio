import { observer } from "mobx-react-lite";
import { useZaloMiniAppCatalog } from "@/features/products/hooks/useZaloMiniAppCatalog";
import { useZaloMiniAppCart } from "@/features/cart/hooks/useZaloMiniAppCart";

export const ZaloCatalogSection = observer(function ZaloCatalogSection() {
  const { query, items } = useZaloMiniAppCatalog();
  const cart = useZaloMiniAppCart();

  return (
    <section className="zalo-card">
      <h2>Catalog</h2>
      <p className="muted">Du lieu lay tu /api/v1/products/showroom va hydrate vao MobX store.</p>

      {query.isLoading ? <p>Dang tai san pham...</p> : null}
      {query.isError ? <p className="error-text">Khong tai duoc catalog.</p> : null}

      <div className="grid-list">
        {items.map((item) => (
          <article key={item.id} className="product-item">
            <div>
              <p className="title">{item.name}</p>
              <p className="muted">{item.salePrice.toLocaleString("vi-VN")} VND</p>
            </div>
            <button
              type="button"
              onClick={() =>
                cart.addItem({
                  productId: item.id,
                  unitPrice: item.salePrice,
                  quantity: 1,
                  name: item.name,
                })
              }
            >
              Them vao gio
            </button>
          </article>
        ))}
      </div>
    </section>
  );
});
