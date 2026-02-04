"use client";

import { GraphProvider } from "@/components/graph-explorer-2/graph-context";

export default function Graph2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GraphProvider>{children}</GraphProvider>;
}
