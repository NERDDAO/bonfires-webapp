"use client";

import { GraphProvider } from "@/components/graph-explorer/graph-context";

export default function Graph2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GraphProvider>{children}</GraphProvider>;
}
