import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Delve - Knowledge Graph Platform",
    template: "%s | Delve",
  },
  description:
    "Explore, visualize, and interact with knowledge graphs. Create data rooms, generate hyperblogs, and leverage AI agents for intelligent discovery.",
  keywords: [
    "knowledge graph",
    "graph visualization",
    "AI agents",
    "data rooms",
    "Web3",
  ],
  authors: [{ name: "Delve Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Delve",
    title: "Delve - Knowledge Graph Platform",
    description:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms and leverage AI agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delve - Knowledge Graph Platform",
    description:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms and leverage AI agents.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const clerkLocalization = {
  organizationSwitcher: {
    action__manageOrganization: "Manage",
  },
  organizationProfile: {
    navbar: {
      title: "Bonfire",
      description: "Manage your bonfire.",
    },
    invitePage: {
      title: "Invite Members",
      subtitle: "Invite new members to this bonfire.",
    },
    start: {
      profileSection: {
        title: "Bonfire Profile",
      },
    },
    profilePage: {
      dangerSection: {
        leaveOrganization: {
          title: "Leave Bonfire",
          messageLine1:
            "Are you sure you want to leave this bonfire? You will lose access to this bonfire and its applications.",
          messageLine2: "This action is permanent and irreversible.",
          successMessage: "You have left the bonfire.",
          actionDescription: 'Type "{{organizationName}}" below to continue.',
        },
        deleteOrganization: {
          title: "Delete Bonfire",
          messageLine1: "Are you sure you want to delete this bonfire?",
          messageLine2: "This action is permanent and irreversible.",
          successMessage: "You have deleted the bonfire.",
          actionDescription: 'Type "{{organizationName}}" below to continue.',
        },
        title: "Danger",
      },
    },
  },
  organizationList: {
    title: "Select a Bonfire",
    subtitle: "Select a bonfire to continue.",
    action__createOrganization: "Create Bonfire",
    titleWithoutPersonal: "Choose a bonfire",
  },
  createOrganization: {
    title: "Create Bonfire",
    subtitle: "Set up a new bonfire.",
    formButtonSubmit: "Create bonfire",
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang="en" suppressHydrationWarning data-theme="dark">
        <body
          className={`${inter.variable} font-sans antialiased min-h-screen bg-base-100`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
