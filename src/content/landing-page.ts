import { siteCopy } from "./site";
import { LINKS_DATA, NODES_DATA } from "./static-graph";

export const heroCopy = {
  logo: "/eth-boulder-logo.svg",
  logoAlt: "Eth Boulder",
  title: "Collective Sensemaking Experience",
  description:
    "Explore, visualize and interact with ETHBoulder's collective intelligence.",
  primaryCta: "Explore Graph",
  primaryCtaHref: "/graph",
  secondaryCta: "Join ETH Boulder Telegram group",
  secondaryCtaHref: siteCopy.telegramGroupUrl,
};

export const staticGraphNodes = {
  NODES_DATA,
  LINKS_DATA,
};

export const knowledgeGraphSectionCopy = {
  title: "Knowledge Graph",
  subtitle:
    "The Structuring Process.",
  description: "Navigate the knowledge produced at ETHBoulder through the interactive graph viewer. Explore users, ideas, relationships and more through the structured context of the Bonfire.",
  paragraphs: [
    {
      heading: "Episodic Memory",
      description:
        "The graph is constructed from episodic summaries, snapshots taken every 20 minutes across all chats and channels. This provides longitudinal memory of the conference, capturing vibes, not just data.",
    },
    {
      heading: "Entity Extraction",
      description:
        "Episodes contain the narrative and activity of the conference. The Bonfire then extracts notable entities such as users, concepts, actions and events, helping the agent stay informed.",
    },
    {
      heading: "Relationship Mapping",
      description:
        "Entities are then related to each other, giving the Bonfire a crystal clear vision of how everyone relates to every thing. This provides an intelligent, coherent view of the conference for the AI to read.",
    },
  ],
  cta: "Explore ETH Boulder Graph",
  ctaHref: "/graph",
};

export const hyperblogsPreviewSectionCopy = {
  title: "Hyperblogs",
  tooltipIcon: "/icons/tooltip.svg",
  tooltipAlt: "Hyperblogs Info",
  cta: "Create your own",
  ctaHref: "/hyperblogs",
  description: "Hyperblogs are a long forms information format, which is generated from the context of the information already stored in the knowledge graph. It’s a way for users to potentially monetize their contributed pieces of knowledge.",
  featuredBlogTitle: "Featured Hyperblog",
  latestBlogsTitle: "Latest Hyperblogs",
  viewMoreCtaTitle: "View More",
  viewMoreCtaHref: "/hyperblogs",
};

export const howItWorksSectionCopy = {
  title: "How It Works",
  description: "From knowledge exploration to monetization, Delve provides a complete platform for working with AI-powered knowledge graphs.",
  steps: [
    {
      icon: "icons/search.svg",
      title: "Explore Knowledge Graphs",
      description: "Navigate interconnected knowledge through interactive graph visualizations. Discover entities, relationships, and episodes with AI-assisted exploration.",
    },
    {
      icon: "icons/upload-file.svg",
      title: "Upload & Process Documents",
      description: "Feed documents into the system to automatically extract knowledge. Our AI processes content, creates chunks, and generates taxonomies.",
    },
    {
      icon: "icons/cottage.svg",
      title: "Create Data Rooms",
      description: "Package your knowledge into monetizable data rooms. Set pricing, access controls, and let others subscribe to your curated knowledge.",
    },
    {
      icon: "icons/auto-awesome.svg",
      title: "Generate HyperBlogs",
      description: "Transform knowledge graphs into comprehensive AI-generated blog posts. Publish content with blockchain-verified payments.",
    },
  ],
};

export const footerCopy = {
  title: "Ready to Explore?",
  mobileTitle: "Light up the Dark Forest",
  subtitle: "Dive into knowledge graphs, create data rooms, or generate your first HyperBlog. Use the navigation above to get started.",
  mobileSubtitle: "For any questions, collaborations, partnerships or anything else, contact us!",
  primaryCta: "Explore Graph",
  primaryCtaHref: "/graph",
  secondaryCta: "Join ETH Boulder Telegram group",
  secondaryCtaHref: siteCopy.telegramGroupUrl,
  logo: "/eth-boulder-logo.svg",
  logoAlt: "Eth Boulder",
  socialLinks: [
    {
      icon: "/icons/twitter.svg",
      href: siteCopy.twitterUrl,
    },
    {
      icon: "/icons/discord.svg",
      href: siteCopy.discordUrl,
    },
    {
      icon: "/icons/telegram.svg",
      href: siteCopy.telegramGroupUrl,
    },
  ],
};