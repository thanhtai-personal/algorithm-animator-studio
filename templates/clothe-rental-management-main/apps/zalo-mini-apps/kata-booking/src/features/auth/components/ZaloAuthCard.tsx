import { observer } from "mobx-react-lite";
import { useZaloMiniAppAuth } from "@/features/auth/hooks/useZaloMiniAppAuth";

export const ZaloAuthCard = observer(function ZaloAuthCard() {
  const auth = useZaloMiniAppAuth();

  return (
    <section className="zalo-card">
      <h2>Xac thuc Zalo Mini App</h2>
      <p className="muted">Authorize + getAccessToken + getUserInfo va map session backend.</p>

      {auth.isAuthenticated ? (
        <div className="row gap">
          <span className="badge success">Da dang nhap</span>
          <button type="button" className="ghost" onClick={auth.logout}>
            Dang xuat
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => void auth.login()} disabled={auth.isLoading}>
          {auth.isLoading ? "Dang xu ly..." : "Dang nhap voi Zalo"}
        </button>
      )}

      {auth.errorMessage ? <p className="error-text">{auth.errorMessage}</p> : null}
    </section>
  );
});
