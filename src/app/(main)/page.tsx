"use client";

import {
  Footer,
  Hero,
  HowItWorks,
  HyperBlogsPreview,
  KnowledgeGraph,
} from "@/components/landing-page";
import { siteCopy } from "@/content";
import { useSubdomainBonfire } from "@/contexts";

export default function HomePage() {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const staticGraph =
    isSubdomainScoped && subdomainConfig && subdomainConfig.agentId
      ? {
          staticBonfireId: subdomainConfig.bonfireId,
          staticAgentId: subdomainConfig.agentId,
        }
      : siteCopy.staticGraph;

  return (
    <main className="overflow-x-hidden max-w-screen-2xl mx-auto">
      <Hero staticGraph={staticGraph} />
      <KnowledgeGraph />
      <HyperBlogsPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}
