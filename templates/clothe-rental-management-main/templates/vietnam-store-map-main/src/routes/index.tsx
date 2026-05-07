import { createFileRoute } from "@tanstack/react-router";
import { VietnamMap } from "@/components/VietnamMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiệm Thuê Đồ — Hệ thống cửa hàng" },
      {
        name: "description",
        content:
          "Khám phá hệ thống cửa hàng Tiệm Thuê Đồ trên bản đồ Việt Nam: Phú Thọ và Đắk Nông.",
      },
      { property: "og:title", content: "Tiệm Thuê Đồ — Hệ thống cửa hàng" },
      {
        property: "og:description",
        content: "Bản đồ 3D định vị các cửa hàng Tiệm Thuê Đồ trên toàn quốc.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative grid */}
      <div className="bg-grid absolute inset-0 opacity-40" />

      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.72 0.18 35 / 0.25)" }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.78 0.15 200 / 0.25)" }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-6 py-12 lg:flex-row lg:gap-16 lg:py-20">
        {/* Left: Hero text */}
        <div className="flex-1 text-center lg:text-left">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest"
            style={{
              borderColor: "oklch(0.78 0.2 55 / 0.4)",
              background: "oklch(0.2 0.04 250 / 0.6)",
              color: "oklch(0.85 0.15 55)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.78 0.2 55)" }} />
            Hệ thống cửa hàng
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Tiệm Thuê Đồ
            </span>
            <span className="mt-2 block text-3xl font-light text-foreground/80 md:text-4xl">
              trên khắp Việt Nam
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-foreground/60 lg:mx-0 lg:text-lg">
            Khám phá bản đồ 3D với các điểm cửa hàng của chúng tôi. Chạm vào marker
            để ghé thăm cửa hàng yêu thích của bạn.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md"
              style={{
                borderColor: "oklch(0.75 0.2 35 / 0.3)",
                background: "oklch(0.2 0.04 250 / 0.5)",
              }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  background: "oklch(0.75 0.2 35)",
                  boxShadow: "0 0 12px oklch(0.75 0.2 35)",
                }}
              />
              <div>
                <div className="text-sm font-semibold">Phú Thọ</div>
                <div className="text-xs text-foreground/50">Tiệm July</div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md"
              style={{
                borderColor: "oklch(0.78 0.18 200 / 0.3)",
                background: "oklch(0.2 0.04 250 / 0.5)",
              }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  background: "oklch(0.78 0.18 200)",
                  boxShadow: "0 0 12px oklch(0.78 0.18 200)",
                }}
              />
              <div>
                <div className="text-sm font-semibold">Đắk Nông</div>
                <div className="text-xs text-foreground/50">Tiệm Kata</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="mt-12 flex-1 lg:mt-0">
          <VietnamMap />
        </div>
      </div>
    </main>
  );
}
