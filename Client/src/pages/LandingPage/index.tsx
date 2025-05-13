// src/pages/LandingPage.tsx
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Section01 from "@/components/landing/Section01";
import Section02 from "@/components/landing/Section02";
import Section03 from "@/components/landing/Section03";
import Section04 from "@/components/landing/Section04";
import Section05 from "@/components/landing/Section05";
import Section06 from "@/components/landing/Section06";
import Section07 from "@/components/landing/Section07";
import Faqs from "@/components/landing/Faqs";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header />
      <main className="grow">
        <Hero />
        <Section01 />
        <Section02 />
        <Section03 />
        <Section04 />
        <Section05 />
        <Section06 />
        <Section07 />
        <Faqs />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}