/**
 * Site-wide copy for metadata and SEO only.
 * For UI labels (buttons, dropdowns, etc.) use the `common` or feature-specific content modules.
 */
export const siteCopy = {
  siteName: "bonfires.ai",
  title: "EthBoulder - Collective Sensemaking Experience",
  template: "%s | Bonfires.ai",
  description: {
    default:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms, generate hyperblogs, and leverage AI agents for intelligent discovery.",
    short:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms and leverage AI agents.",
  },
  keywords: [
    "knowledge graph",
    "graph visualization",
    "AI agents",
    "data rooms",
    "Web3",
  ],
  author: "bonfires.ai",
  telegramGroupUrl: "https://t.me/bonfiresai",
  twitterUrl: "https://x.com/bonfiresai",
  discordUrl: "https://discord.gg/bonfiresai",
  staticGraph: {
    staticBonfireId: "68962cbc2c14173dafbe6dc9",
    staticAgentId: "68cadde6d6ce58d6050e8f7a",
  },
  docsUrl: "https://docs.bonfires.ai/bonfires/docs/files/Welcome",
} as const;
