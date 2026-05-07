import { ZaloPlatformGate } from "@/features/platform/components/ZaloPlatformGate";
import { RentalRevenueSection } from "@/features/rental-revenue/components/RentalRevenueSection";

export function App() {
  return (
    <ZaloPlatformGate>
      <main className="page">
        <RentalRevenueSection />
      </main>
    </ZaloPlatformGate>
  );
}
