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
    <main className="max-w-dvw overflow-x-hidden">
      <Hero />
      <KnowledgeGraph />
      <HyperBlogsPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}
