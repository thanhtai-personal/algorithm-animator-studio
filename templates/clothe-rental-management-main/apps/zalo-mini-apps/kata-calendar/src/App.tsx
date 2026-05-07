import { observer } from "mobx-react-lite";
import { ZaloAuthCard } from "@/features/auth/components/ZaloAuthCard";
import { useZaloMiniAppAuth } from "@/features/auth/hooks/useZaloMiniAppAuth";
import { ZaloCalendarSection } from "@/features/calendar/components/ZaloCalendarSection";
import { ZaloPlatformGate } from "@/features/platform/components/ZaloPlatformGate";

export const App = observer(function App() {
  const auth = useZaloMiniAppAuth();

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Trung tâm điều hành KATA.</p>
        <h1>Lịch KATA Makeup</h1>
        <p className="muted">Chỉ admin/chuyên viên makeup đã đăng nhập mới xem được lịch đã đặt.</p>
      </header>

      <section className="stack">
        <ZaloPlatformGate>
          {auth.isAuthenticated && auth.accessToken ? (
            <>
              <div className="row gap wrap auth-row">
                <span className="badge success">Đã đăng nhập tài khoản web</span>
                <button type="button" className="ghost" onClick={auth.logout}>
                  Đăng xuất
                </button>
              </div>

              {auth.isAuthContextLoading ? (
                <section className="card">Đang kiểm tra quyền truy cập lịch...</section>
              ) : auth.hasCalendarAccess ? (
                <ZaloCalendarSection
                  accessToken={auth.accessToken}
                  branchId={auth.branchId}
                  role={auth.role}
                  profileId={auth.profileId}
                  roleLabel={auth.roleLabel}
                  displayName={auth.displayName}
                  onLogout={auth.logout}
                />
              ) : !auth.authContext ? (
                <section className="card error">
                  <h3>Không tải được thông tin quyền</h3>
                  <p className="muted">{auth.errorMessage ?? "Vui lòng đăng xuất và đăng nhập lại."}</p>
                </section>
              ) : (
                <section className="card error">
                  <h3>Không có quyền truy cập</h3>
                  <p className="muted">
                    Tài khoản đã đăng nhập chưa có quyền admin/chuyên viên makeup để xem lịch.
                  </p>
                  <div className="row gap wrap">
                    <button type="button" className="ghost" onClick={auth.logout}>
                      Đăng xuất và đổi tài khoản
                    </button>
                  </div>
                </section>
              )}
            </>
          ) : (
            <ZaloAuthCard />
          )}
        </ZaloPlatformGate>
      </section>
    </main>
  );
});
