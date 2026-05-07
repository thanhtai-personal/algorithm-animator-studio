import ShopHeader from "@/components/ShopHeader";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import ProductsSection from "@/components/ProductsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import ShopFooter from "@/components/ShopFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />
      <HeroSection />
      <StatsSection />
      <ProductsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <ShopFooter />
    </div>
  );
};

export default Index;
