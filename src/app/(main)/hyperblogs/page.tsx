import { HyperBlogsHeader } from "@/components/hyperblogs";
import DataroomFeed from "@/components/hyperblogs/dataroom-feed";

export default function HyperBlogsPage() {
  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      <HyperBlogsHeader />
      <DataroomFeed />
    </main>
  );
}
