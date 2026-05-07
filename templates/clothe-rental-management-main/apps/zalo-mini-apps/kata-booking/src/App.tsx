import { ZaloMakeupBookingSection } from "@/features/makeup/components/ZaloMakeupBookingSection";

export function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Trung tâm điều hành KATA.</p>
        <h1>Đặt lịch KATA Makeup</h1>
        <p className="muted">Form đặt lịch makeup tối giản cho Zalo Mini App.</p>
      </header>

      <section className="stack">
        <ZaloMakeupBookingSection />
      </section>
    </main>
  );
}
