import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useZaloMiniAppAuth } from "@/features/auth/hooks/useZaloMiniAppAuth";

export const ZaloAuthCard = observer(function ZaloAuthCard() {
  const auth = useZaloMiniAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="zalo-card auth-card">
      <p className="eyebrow">Đăng nhập tài khoản web</p>
      <h2>KATA Rental Order</h2>
      <p className="muted">Dùng cùng email và mật khẩu với phiên bản web để lấy đúng role nội bộ.</p>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          void auth.login(email, password);
        }}
      >
        <label className="field auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              auth.clearError();
              setEmail(event.target.value);
            }}
            placeholder="you@kata.vn"
            required
          />
        </label>

        <label className="field auth-field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              auth.clearError();
              setPassword(event.target.value);
            }}
            placeholder="Nhập mật khẩu"
            required
          />
        </label>

        <button type="submit" disabled={auth.isLoading}>
          {auth.isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {auth.errorMessage ? <p className="error-text">{auth.errorMessage}</p> : null}
    </section>
  );
});
