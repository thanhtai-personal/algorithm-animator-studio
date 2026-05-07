import { FormEvent, useState } from "react";
import { observer } from "mobx-react-lite";
import { useZaloMiniAppAuth } from "@/features/auth/hooks/useZaloMiniAppAuth";

type SignInMethod = "email" | "phone";

export const ZaloAuthCard = observer(function ZaloAuthCard() {
  const auth = useZaloMiniAppAuth();
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await auth.login({
        signInMethod,
        identifier,
        password,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Đăng nhập thất bại.";
      setSubmitError(message);
    }
  };

  return (
    <section className="auth-shell">
      <aside className="auth-aside">
        <p className="auth-badge">KATA Auth</p>
        <h2>Đăng nhập hệ thống web</h2>
        <p className="muted">
          Dùng đúng tài khoản web để mở lịch đã đặt trên mini app.
        </p>
        <p className="auth-hint">
          Chỉ role admin hoặc chuyên viên makeup mới xem được lịch.
        </p>
      </aside>

      <div className="auth-main">
        <h3>Đăng nhập</h3>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-method-switch">
            <button
              type="button"
              className={signInMethod === "email" ? "active" : ""}
              disabled={auth.isLoading}
              onClick={() => setSignInMethod("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={signInMethod === "phone" ? "active" : ""}
              disabled={auth.isLoading}
              onClick={() => setSignInMethod("phone")}
            >
              Số điện thoại
            </button>
          </div>

          <label>
            {signInMethod === "phone" ? "Số điện thoại" : "Email"}
            <input
              type={signInMethod === "phone" ? "tel" : "email"}
              autoComplete={signInMethod === "phone" ? "tel" : "email"}
              value={identifier}
              disabled={auth.isLoading}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={signInMethod === "phone" ? "Nhập số điện thoại" : "you@example.com"}
              required
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={auth.isLoading}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </label>

          <button type="submit" disabled={auth.isLoading}>
            {auth.isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {submitError ? <p className="error-text">{submitError}</p> : null}
        {auth.errorMessage ? <p className="error-text">{auth.errorMessage}</p> : null}
      </div>
    </section>
  );
});
