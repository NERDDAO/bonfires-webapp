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
  secondaryCtaMobile: "Join TG",
  secondaryCtaHref: siteCopy.telegramGroupUrl,
};

export const staticGraphNodes = {
  NODES_DATA,
  LINKS_DATA,
};

export const knowledgeGraphSectionCopy = {
  title: "Knowledge Graph",
  subtitle: "The Structuring Process.",
  description:
    "Navigate the knowledge produced at ETHBoulder through the interactive graph viewer. Explore users, ideas, relationships and more through the structured context of the Bonfire.",
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
  tooltipContent: [
    "Hyperblogs are a novel product ecosystem from Bonfires. They provide users an avenue to generate static content from the dynamically updating graph.",
    "When creating Hyperblogs, users may choose a Topic (a focus node on the graph, through which the Hyperblog context is retrieved) and a Prompt. The Prompt tells the system the narrative of the Hyperblog, informing which data is retrieved from the graph to populate the blog content.",
    "Hyperblogs at ETHBoulder cost $0.25 and are payable in USDC on Base using x402 payments."
  ],
  description: "Hyperblogs are longer-form content generated from the Bonfire. Users provide custom prompts which are used to retrieve data from the graph, within specific topic areas. Hyperblogs provide a static viewpoint of the dynamic graph, allowing you to share your own interests with the world.",
  featuredBlogTitle: "Featured Hyperblog",
  latestBlogsTitle: "Latest Hyperblogs",
  viewMoreCtaTitle: "View More",
  viewMoreCtaHref: "/hyperblogs",
};

export const howItWorksSectionCopy = {
  title: "How It Works",
  description:
    "From discussions to structured insights, the Bonfires system provides a complete platform for exploring and sharing human knowledge with AI.",
  steps: [
    {
      icon: "icons/search.svg",
      title: "Data Ingestion",
      description:
        "Messages, documents, web scrapes and transcripts provide raw text data to the Bonfire, assisted by our agent framework.",
    },
    {
      icon: "icons/upload-file.svg",
      title: "Graph Creation",
      description:
        "Ingested text is processed into Episodes, 20-minute summaries of activity, to be formed into a knowledge graph. Entites, relationships and metadata are generated to inform the graph's reader.",
    },
    {
      icon: "icons/cottage.svg",
      title: "Delve the Bonfire",
      description:
        "The graph provides a powerful vector to deeply understand and coordinate around the various knowledge inputs. Both humans and AI can deeply delve into the data through the graphs.",
    },
    {
      icon: "icons/auto-awesome.svg",
      title: "Share and Monetise",
      description:
        "Bonfire graphs are a knowledge asset. Expose these graph to agents, to other people or to content generators such as Hyperblogs to create your own Knowledge Economy.",
    },
  ],
};

export const footerCopy = {
  title: "Ready to Explore?",
  mobileTitle: "Light up the Dark Forest",
  subtitle:
    "Dive into knowledge graphs, create data rooms, or generate your first HyperBlog. Use the navigation above to get started.",
  mobileSubtitle:
    "For any questions, collaborations, partnerships or anything else, contact us!",
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
