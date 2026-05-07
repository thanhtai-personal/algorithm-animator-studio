"use client";

import Link from "next/link";

export default function OfflineFallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offline</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Bạn đang ngoại tuyến</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Không thể tải dữ liệu mới từ máy chủ. Một số nội dung đã cache vẫn có thể dùng được.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/vi"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground"
          >
            Thử lại
          </button>
        </div>
      </section>
    </main>
  );
}
