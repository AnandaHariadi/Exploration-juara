import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ClientScaleComparison } from "@/components/landing/ClientScaleComparison";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ClientScaleComparison />
      <WorkflowSteps />
      <FaqSection />
      <Footer />
    </main>
  );
}
