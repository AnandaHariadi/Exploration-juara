import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ClientScaleComparison } from "@/components/landing/ClientScaleComparison";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";
import { ScrollAnimationObserver } from "@/components/landing/ScrollAnimationObserver";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <ScrollAnimationObserver />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ClientScaleComparison />
      <WorkflowSteps />
      <PricingSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
