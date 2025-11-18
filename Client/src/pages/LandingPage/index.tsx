// src/pages/LandingPage.tsx
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WhoWeServe from "@/components/landing/WhoWeServe";
import KeyFeatures from "@/components/landing/KeyFeatures";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-white">
      <Header />
      <main className="grow">
        <Hero />
        <WhoWeServe />
        <KeyFeatures />
        <HowItWorks />
        <Benefits />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}