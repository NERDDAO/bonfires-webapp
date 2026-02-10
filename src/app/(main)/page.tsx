"use client";

import { useSiteConfig } from "@/contexts";

export default function HomePage() {
  const { landing: Landing } = useSiteConfig();
  return <Landing />;
}
