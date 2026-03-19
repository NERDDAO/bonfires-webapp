import { HyperblogsTabbedView } from "@/components/hyperblogs/hyperblogs-tabbed-view";

export default function HyperBlogsPage() {
  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      <HyperblogsTabbedView />
    </main>
  );
}
