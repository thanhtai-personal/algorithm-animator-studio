import { ZaloPlatformGate } from "@/features/platform/components/ZaloPlatformGate";
import { RentalOrderSection } from "@/features/rental-order/components/RentalOrderSection";
import { ToastProvider, ToastContainer } from "@/lib/hooks/use-toast";

export function App() {
  return (
    <ToastProvider>
      <ZaloPlatformGate>
        <main className="page">
          <RentalOrderSection />
        </main>
      </ZaloPlatformGate>
      <ToastContainer />
    </ToastProvider>
  );
}
