"use client";

import {
  Footer,
  Hero,
  HowItWorks,
  HyperBlogsPreview,
  KnowledgeGraph,
} from "@/components/landing-sections";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden max-w-screen-2xl mx-auto">
      <Hero />
      <KnowledgeGraph />
      <HyperBlogsPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}
