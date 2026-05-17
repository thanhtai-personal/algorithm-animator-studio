import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Youtube, Upload, LogIn, Unlink } from "lucide-react";

export const Route = createFileRoute("/youtube")({
  component: YouTubePage,
});

function YouTubePage() {
  return (
    <AppShell>
      <PageHeader
        title="Đăng YouTube"
        description="Cấp quyền ứng dụng và đăng video đã tạo lên kênh của bạn."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-display font-semibold">Trạng thái cấu hình</h3>
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-success">● Mã ứng dụng</span>
              <span className="chip chip-success">● Khóa bí mật</span>
              <span className="chip chip-success">● Mã làm mới quyền</span>
            </div>
            <p className="text-xs text-muted-foreground">Mã làm mới quyền được lưu trong trình duyệt sau khi cấp quyền.</p>
          </div>

          <div className="surface-card p-6 space-y-3">
            <h3 className="font-display font-semibold">Cấp quyền YouTube</h3>
            <button className="w-full h-11 rounded-xl btn-primary-grad font-semibold inline-flex items-center justify-center gap-2">
              <LogIn className="size-4" /> Đăng nhập lại YouTube
            </button>
            <button className="w-full h-11 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center gap-2 text-sm font-medium">
              <Unlink className="size-4" /> Ngắt liên kết YouTube
            </button>
            <p className="text-xs text-muted-foreground">Sau khi Google xác nhận, ứng dụng tự quay lại trang này và lưu mã quyền.</p>
          </div>
        </div>

        <div className="lg:col-span-2 surface-card p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-destructive/15 text-destructive grid place-items-center">
              <Youtube className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Đăng video</h2>
              <p className="text-xs text-muted-foreground">Cấu hình metadata và tải lên kênh</p>
            </div>
          </div>

          <Field label="Tệp video">
            <div className="border border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="size-6 mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm">Chọn tệp hoặc kéo thả vào đây</div>
              <div className="text-xs text-muted-foreground">MP4 — tối đa 2GB</div>
            </div>
          </Field>

          <Field label="Tiêu đề"><input className="input" defaultValue="Video tạo từ KATA" /></Field>
          <Field label="Mô tả"><textarea rows={3} className="input" /></Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Thẻ"><input className="input" defaultValue="truyen audio,piper,tts" /></Field>
            <Field label="Thời điểm đăng"><input type="datetime-local" className="input" /></Field>
            <Field label="Quyền riêng tư"><select className="input"><option>Không công khai</option><option>Công khai</option><option>Riêng tư</option></select></Field>
            <Field label="Mã danh mục"><input className="input" defaultValue="22" /></Field>
          </div>

          <Field label="Playlist"><select className="input"><option>Không thêm vào playlist</option></select></Field>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" /> Dành cho trẻ em</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-primary" /> Thông báo cho người đăng ký</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-primary" /> Có nội dung tạo bằng AI</label>
          </div>

          <button className="w-full h-12 rounded-xl btn-primary-grad font-semibold inline-flex items-center justify-center gap-2">
            <Upload className="size-4" /> Đăng video lên YouTube
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
