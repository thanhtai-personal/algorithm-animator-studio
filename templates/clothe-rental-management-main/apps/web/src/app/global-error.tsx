"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 text-center">
            <h2 className="text-xl font-semibold">Đã xảy ra lỗi hệ thống</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sự cố đã được ghi nhận. Vui lòng thử lại thao tác hoặc tải lại trang.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
