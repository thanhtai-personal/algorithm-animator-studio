import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import KPIHeroGrid from "@/components/dashboard/KPIHeroGrid";
import TabNavigation from "@/components/dashboard/TabNavigation";
import OverviewTab from "@/components/dashboard/OverviewTab";
import RevenueTab from "@/components/dashboard/RevenueTab";
import ActionTab from "@/components/dashboard/ActionTab";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";

const Index = () => {
  const [activePeriod, setActivePeriod] = useState("today");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <DashboardHeader branch="KATA Quận 1" period="Hôm nay, 28/03/2026" />
      <DashboardFilters activePeriod={activePeriod} onPeriodChange={setActivePeriod} />
      <KPIHeroGrid />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "revenue" && <RevenueTab />}
      {activeTab === "actions" && <ActionTab />}

      <QuickActionsBar />
    </div>
  );
};

export default Index;
