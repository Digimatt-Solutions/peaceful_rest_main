import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Memorials } from "@/components/site/Memorials";
import { Services } from "@/components/site/Services";
import { HowItWorks } from "@/components/site/HowItWorks";
import { WhyUs } from "@/components/site/WhyUs";

import { CtaBanner } from "@/components/site/CtaBanner";
import { Footer } from "@/components/site/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Makiwa - Honoring Lives, Preserving Memories";
    const desc = "Create beautiful online memorials, share tributes, plan services, and support grieving families with Makiwa.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Memorials />
      <Services />
      <HowItWorks />
      <WhyUs />
      
      <CtaBanner />
      <Footer />
    </main>
  );
};

export default Index;
