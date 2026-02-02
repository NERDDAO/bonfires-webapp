import { HyperBlogsHeader } from "@/components/hyperblogs";
import DataroomsFeed from "@/components/hyperblogs/dataroomsFeed";

export default function HyperBlogsPage() {
  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen">
      <HyperBlogsHeader />
      <DataroomsFeed />
    </main>
  );
}