"use client";

import Link from "next/link";
import {
  FeatureCard,
  HyperBlogFeedPreview,
  TechStack,
  HowItWorks,
} from "@/components/landing";
import { Header } from "@/components/shared/Header";

// Feature card icons as SVG components
function GraphIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7 text-primary"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
      />
    </svg>
  );
}

function Web3Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7 text-secondary"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
}

function DocumentsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7 text-accent"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-base-100">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                Delve
              </span>
              <span className="block text-base-content mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold">
                Knowledge Graph Platform
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
              Explore, visualize, and interact with AI-powered knowledge graphs.
              Create monetizable data rooms, generate AI blog posts, and
              leverage intelligent agents for discovery.
            </p>

            {/* Quick navigation links */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <Link
                href="/graph"
                className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/20"
              >
                <GraphIcon />
                Explore Graph
              </Link>
              <Link href="/documents" className="btn btn-outline btn-lg gap-2">
                <DocumentsIcon />
                Manage Documents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-4 bg-base-200/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-base-content/60 max-w-2xl mx-auto">
              Three interconnected feature sets that work together to help you
              organize, monetize, and share knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Graph Explorer"
              description="Visualize and navigate complex knowledge graphs with interactive exploration tools."
              icon={<GraphIcon />}
              variant="graph"
              href="/graph"
              badge="Free"
              features={[
                "Interactive visualization",
                "Node expansion & search",
                "AI-assisted chat",
                "Entity & episode timeline",
              ]}
            />

            <FeatureCard
              title="Web3 Features"
              description="Create and monetize curated knowledge spaces with blockchain-powered access control."
              icon={<Web3Icon />}
              variant="web3"
              href="/datarooms"
              badge="Monetize"
              features={[
                "Data Room marketplace",
                "HyperBlogs generation",
                "x402 paid chat & delve",
                "Subscription management",
              ]}
            />

            <FeatureCard
              title="Documents"
              description="Upload and process documents to automatically extract and structure knowledge."
              icon={<DocumentsIcon />}
              variant="documents"
              href="/documents"
              badge="Ingest"
              features={[
                "PDF, TXT, MD support",
                "Automatic chunking",
                "Taxonomy labeling",
                "Knowledge extraction",
              ]}
            />
          </div>
        </div>
      </section>

      {/* HyperBlogs Feed Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <HyperBlogFeedPreview limit={6} title="Latest HyperBlogs" />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Technology Stack */}
      <section className="py-16 px-4">
        <TechStack />
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-base-200 to-base-300">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-base-content/60 mb-8 text-lg">
            Dive into knowledge graphs, create data rooms, or generate your
            first HyperBlog. Use the navigation above to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/graph"
              className="btn btn-primary btn-lg"
            >
              Start Exploring
            </Link>
            <Link
              href="/hyperblogs"
              className="btn btn-outline btn-lg"
            >
              Browse HyperBlogs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
