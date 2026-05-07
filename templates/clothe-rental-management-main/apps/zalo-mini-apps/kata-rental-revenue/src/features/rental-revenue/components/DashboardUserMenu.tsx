import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { FieldVoiceButton } from "@/components/voice/FieldVoiceButton";
import type { ZaloMiniAppRentalAccessDto } from "@/lib/contracts";

function formatRoleLabel(role: string | null | undefined): string {
  if (role === "owner_admin") return "Chủ hệ thống";
  if (role === "manager") return "Quản lý";
  if (role === "staff") return "Nhân viên";
  if (role === "accountant") return "Kế toán";
  return role ?? "Nội bộ";
}

export function DashboardUserMenu({
  access,
  branchId,
  startDate,
  endDate,
  granularity,
  onBranchChange,
  onStartDateChange,
  onEndDateChange,
  onGranularityChange,
  onDateTranscript,
  onLogout,
}: {
  access: ZaloMiniAppRentalAccessDto;
  branchId: string | null;
  startDate: string;
  endDate: string;
  granularity: "day" | "month" | "year";
  onBranchChange: (branchId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGranularityChange: (value: "day" | "month" | "year") => void;
  onDateTranscript: (field: "startDate" | "endDate", value: string) => void;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousLeft = body.style.left;
    const previousRight = body.style.right;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.left = previousLeft;
      body.style.right = previousRight;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="ghost app-header-menu-button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu tài khoản"
      >
        <Menu className="icon" />
      </button>

      <button
        type="button"
        className={`drawer-overlay ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-label="Đóng menu"
      />

      <aside className={`right-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
        <div className="right-drawer-head">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h2>{access.displayName ?? "Tài khoản nội bộ"}</h2>
          </div>
          <button
            type="button"
            className="ghost drawer-close-button"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng drawer"
          >
            <X className="icon" />
          </button>
        </div>

        <div className="right-drawer-body">
          <div className="app-header-meta">
            <span className="badge success">Đã đăng nhập</span>
            <span className="badge">{formatRoleLabel(access.role)}</span>
          </div>

          <div className="drawer-info-list">
            <div className="drawer-info-card">
              <span className="drawer-info-label">Người dùng</span>
              <strong>{access.displayName ?? "Tài khoản nội bộ"}</strong>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Vai trò</span>
              <strong>{formatRoleLabel(access.role)}</strong>
            </div>
            <label className="drawer-info-card drawer-branch-card">
              <span className="drawer-info-label">Chi nhánh</span>
              <select value={branchId ?? ""} onChange={(event) => onBranchChange(event.target.value)}>
                {access.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Mức tổng hợp</span>
              <div className="drawer-granularity-row">
                <button
                  type="button"
                  className={granularity === "day" ? "" : "ghost"}
                  onClick={() => onGranularityChange("day")}
                >
                  Ngày
                </button>
                <button
                  type="button"
                  className={granularity === "month" ? "" : "ghost"}
                  onClick={() => onGranularityChange("month")}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  className={granularity === "year" ? "" : "ghost"}
                  onClick={() => onGranularityChange("year")}
                >
                  Năm
                </button>
              </div>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Từ ngày</span>
              <div className="input-with-voice">
                <input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
                <FieldVoiceButton onTranscript={(value) => onDateTranscript("startDate", value)} />
              </div>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Đến ngày</span>
              <div className="input-with-voice">
                <input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
                <FieldVoiceButton onTranscript={(value) => onDateTranscript("endDate", value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="right-drawer-footer">
          <button
            type="button"
            className="ghost drawer-logout-button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
