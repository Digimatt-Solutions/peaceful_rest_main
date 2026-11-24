import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const LegalComingSoon = ({ title, path }: { title: string; path: string }) => (
  <main className="min-h-screen bg-background">
    <Helmet>
      <title>{title} | Makiwa</title>
      <meta name="description" content={`Makiwa ${title} — Coming Soon.`} />
      <link rel="canonical" href={`${window.location.origin}${path}`} />
    </Helmet>
    <Navbar />
    <header className="container-luxe pt-32 pb-20">
      <ShieldCheck className="h-8 w-8 text-brand-orange mb-4" />
      <h1 className="font-serif text-4xl">{title}</h1>
      <p role="status" className="mt-5 text-xl text-muted-foreground">Coming Soon</p>
    </header>
    <Footer />
  </main>
);