import { Metadata } from "next";

import { siteCopy } from "@/content";

const { title, template, description, keywords, author, siteName } = siteCopy;

export const metadata: Metadata = {
  title: {
    default: title,
    template,
  },
  description: description.default,
  keywords: [...keywords],
  authors: [{ name: author }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteName,
    title,
    description: description.short,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: description.short,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};
