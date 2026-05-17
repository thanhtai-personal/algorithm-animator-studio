import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Film, Download, FolderOpen, Play } from "lucide-react";

export const Route = createFileRoute("/video")({
  component: VideoPage,
});

function VideoPage() {
  return (
    <AppShell>
      <PageHeader
        title="Tạo Video"
        description="Biến nội dung truyện, mẫu giọng và ảnh nền thành video MP4 sẵn sàng đăng lên YouTube."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Section step="1" title="Nội dung và giọng đọc">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Mẫu giọng">
                <select className="input"><option>Tiếng Việt — vi_VN-vais1000-medium</option></select>
              </Field>
              <Field label="Tên tệp âm thanh">
                <input className="input" defaultValue="than-mo-tap-1" />
              </Field>
            </div>
            <Field label="Khoảng nghỉ sau câu: 1.2s">
              <input type="range" className="range" min={0.2} max={2} step={0.1} defaultValue={1.2} />
            </Field>
            <Field label="Nội dung cần đọc">
              <textarea className="input font-mono text-sm" rows={5} defaultValue={`Đêm ấy, mưa rơi trắng núi.\nTrần Mặc đứng trước cổng tông môn...`} />
            </Field>
          </Section>

          <Section step="2" title="Cấu hình video">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nền video"><select className="input"><option>Ảnh tĩnh</option><option>Video loop</option></select></Field>
              <Field label="Chọn nền video"><input className="input" placeholder="Chưa chọn tệp" /></Field>
              <Field label="Tên tệp video"><input className="input" defaultValue="truyen-audio-video" /></Field>
              <Field label="Tỉ lệ video"><select className="input"><option>16:9 YouTube ngang</option><option>9:16 Shorts</option></select></Field>
              <Field label="Cách trình bày"><select className="input"><option>Phủ kín khung hình</option><option>Chèn giữa</option></select></Field>
            </div>
            <button className="w-full h-11 rounded-xl btn-primary-grad font-semibold inline-flex items-center justify-center gap-2">
              <Film className="size-4" /> Tạo video
            </button>
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section step="3" title="Xem trước" sticky>
            <Field label="Xem trước video đã tạo">
              <select className="input"><option>2026-05-09/truyen-audio-video.mp4</option></select>
            </Field>
            <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black/40 grid place-items-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-glow/10" />
              <button className="relative size-14 rounded-full btn-primary-grad grid place-items-center">
                <Play className="size-6 ml-0.5" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground">Hiện tại: 2026-05-09/truyen-audio-video.mp4</div>
            <div className="flex gap-2">
              <button className="flex-1 h-10 rounded-lg btn-primary-grad font-medium inline-flex items-center justify-center gap-2"><Download className="size-4" /> Tải xuống</button>
              <button className="h-10 px-3 rounded-lg border border-border hover:bg-accent inline-flex items-center gap-2"><FolderOpen className="size-4" /> Mở tệp</button>
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ step, title, children, sticky }: { step: string; title: string; children: React.ReactNode; sticky?: boolean }) {
  return (
    <div className={"surface-card p-6 space-y-4 " + (sticky ? "lg:sticky lg:top-24" : "")}>
      <div className="flex items-center gap-3">
        <span className="size-8 rounded-lg btn-primary-grad grid place-items-center text-sm font-bold">{step}</span>
        <h2 className="text-lg font-display font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
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
