"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSiteConfig } from "@/contexts";

export default function HomePage() {
  const { landing: Landing, features } = useSiteConfig();
  const router = useRouter();

  useEffect(() => {
    if (!features.homePage) {
      router.replace("/graph");
    }
  }, [features.homePage, router]);

  if (!features.homePage) return null;

  return <Landing />;
}
