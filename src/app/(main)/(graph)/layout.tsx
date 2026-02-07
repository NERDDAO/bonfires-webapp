/**
 * Graph Route Group Layout
 * Provides graph-specific layout and styling
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Graph Explorer",
  description: "Explore and visualize knowledge graphs",
};

interface GraphLayoutProps {
  children: React.ReactNode;
}

export default function GraphLayout({ children }: GraphLayoutProps) {
  return <div className="h-screen flex flex-col bg-base-200">{children}</div>;
}
