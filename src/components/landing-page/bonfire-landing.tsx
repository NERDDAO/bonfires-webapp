"use client";

import { siteCopy } from "@/content";
import { useSubdomainBonfire } from "@/contexts";

import Footer from "./footer";
import Hero from "./hero";
import HowItWorks from "./how-it-works";
import HyperBlogsPreview from "./hyperblogs-preview";
import KnowledgeGraph from "./knowledge-graph";

/**
 * Landing page for bonfire subdomains (e.g. bonfire1.app.bonfires.ai).
 * Extracted from the original page.tsx -- identical behavior.
 */
export default function BonfireLanding() {
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
