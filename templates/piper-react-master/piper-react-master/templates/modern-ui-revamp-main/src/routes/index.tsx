import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Sparkles, Wand2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: VoicePage,
});

function VoicePage() {
  return (
    <AppShell>
      <PageHeader
        title="Tạo giọng đọc"
        description="Nhập nội dung, chọn mẫu giọng, đặt tên tệp và tạo âm thanh chất lượng cao với Piper."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success px-2.5 py-1 text-xs font-medium border border-success/20">
            <span className="size-1.5 rounded-full bg-success" /> Piper sẵn sàng
          </span>
        }
      />

      <div className="surface-card p-6 md:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Mẫu giọng">
            <select className="input">
              <option>Tiếng Việt — vi_VN-vais1000-medium</option>
              <option>Tiếng Việt — vi_VN-vivos-medium</option>
            </select>
          </Field>
          <Field label="Tên tệp xuất ra" hint="Không cần nhập .wav. Nếu trùng, máy chủ tự thêm -001, -002.">
            <input className="input" defaultValue="than-mo-tap-1" />
          </Field>
        </div>

        <Field label="Khoảng nghỉ sau câu: 1.2s" hint="Gợi ý: 0.6–0.8 hợp kể truyện. Đoạn cao trào để 0.8–0.9.">
          <input type="range" min={0.2} max={2} step={0.1} defaultValue={1.2} className="range" />
        </Field>

        <Field
          label="Nội dung cần đọc"
          hint='Với tiếng Việt, máy chủ tự đổi dấu . ! ? thành xuống dòng để tránh Piper đọc "chấm".'
          action={
            <button className="btn-ghost text-xs">
              <Trash2 className="size-3.5" /> Xóa nội dung
            </button>
          }
        >
          <textarea
            rows={8}
            className="input font-mono text-sm leading-relaxed"
            defaultValue={`Đêm ấy, mưa rơi trắng núi.
Trần Mặc đứng trước cổng tông môn, trong tay chỉ còn một thanh kiếm gãy.
Hắn từng nghĩ mình sinh ra để làm kẻ tầm thường.
Nhưng khi giọt máu đầu tiên rơi xuống chuôi kiếm, cả trời đất bỗng im lặng.`}
          />
        </Field>

        <button className="w-full h-12 rounded-xl btn-primary-grad font-semibold inline-flex items-center justify-center gap-2">
          <Wand2 className="size-4" /> Tạo tệp âm thanh
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Stat label="Tệp đã tạo hôm nay" value="6" hint="+2 so với hôm qua" />
        <Stat label="Tổng dung lượng" value="2.7 MB" hint="6 tệp WAV" />
        <Stat label="Thời lượng trung bình" value="0:10" hint="Mỗi tệp" />
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        {action}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-display font-bold flex items-center gap-2">
        {value}
        <Sparkles className="size-4 text-primary-glow" />
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
