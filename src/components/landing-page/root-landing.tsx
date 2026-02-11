"use client";

import Image from "next/image";
import Link from "next/link";

import { siteCopy } from "@/content";
import KnowledgeGraph from "./knowledge-graph";
import HyperBlogsPreview from "./hyperblogs-preview";
import HowItWorks from "./how-it-works";
import Footer from "./footer";
/**
 * Landing page for the root domain (app.bonfires.ai).
 *
 * Features:
 * - Hero section with platform overview
 * - Featured hyperblogs from all bonfires
 * - CTA to explore public bonfires
 */
export default function RootLanding() {
  return (
    <main className="overflow-x-hidden max-w-screen-2xl mx-auto">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] px-6 lg:px-20 py-20 text-center">
        <Image
          src="/logo-white.svg"
          alt={siteCopy.siteName}
          width={280}
          height={52}
          className="h-10 lg:h-14 w-auto mb-8"
          priority
        />
        <h1 className="text-4xl lg:text-6xl font-bold text-dark-s-0 max-w-3xl leading-tight">
          Collective Sensemaking,{" "}
          <span className="text-brand-primary">Powered&nbsp;by&nbsp;AI</span>
        </h1>
        <p className="mt-6 text-lg lg:text-xl text-dark-s-60 max-w-2xl">
          {siteCopy.description.default}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            href="/explore"
            className="btn btn-lg bg-brand-primary hover:bg-brand-primary/85 text-brand-black font-semibold border-none"
          >
            Explore Bonfires
          </Link>
          <Link
            href="/hyperblogs"
            className="btn btn-lg bg-transparent border border-dark-s-400 text-dark-s-0 hover:bg-dark-s-800"
          >
            Browse Hyperblogs
          </Link>
        </div>
      </section>

      {/* How it works (brief) */}
      <section className="px-6 lg:px-20 py-16 lg:py-24">
        <h2 className="text-3xl lg:text-4xl font-bold text-dark-s-0 text-center mb-4">
          What is a Bonfire?
        </h2>
        <p className="text-dark-s-60 text-center max-w-2xl mx-auto mb-12 text-lg">
          Each Bonfire is a community-driven knowledge space with its own AI
          agent, knowledge graph, and data rooms.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: "/icons/search.svg",
              title: "Explore Knowledge",
              description:
                "Navigate interconnected knowledge graphs with AI-assisted exploration.",
            },
            {
              icon: "/icons/cottage.svg",
              title: "Create Data Rooms",
              description:
                "Package knowledge into monetizable data rooms with customizable access.",
            },
            {
              icon: "/icons/auto-awesome.svg",
              title: "Generate Hyperblogs",
              description:
                "Transform knowledge into AI-generated blog posts with blockchain verification.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-dark-s-800/50 border border-dark-s-700"
            >
              <Image
                src={step.icon}
                alt=""
                width={32}
                height={32}
                className="mb-4 opacity-80"
              />
              <h3 className="text-lg font-semibold text-dark-s-0 mb-2">
                {step.title}
              </h3>
              <p className="text-dark-s-60 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <KnowledgeGraph />
      <HyperBlogsPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}
