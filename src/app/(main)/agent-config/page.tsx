/**
 * Agent Config Dashboard Page
 *
 * Production-ready agent configuration management.
 * Access: Only org:bonfire_manager and org:bonfire_admin roles.
 */
import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";

import { Header } from "@/components/shared/Header";
import { AgentConfigDashboard } from "@/components/agent-config/AgentConfigDashboard";

export default async function AgentConfigPage() {
  const { orgRole, orgId } = await auth();

  if (orgRole !== "org:bonfire_manager" && orgRole !== "org:bonfire_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Agent Configuration</h1>
          <p className="text-base-content/60 mt-1">
            Manage agents, environment variables, personality, and tools
          </p>
        </div>
        <AgentConfigDashboard orgId={orgId ?? undefined} />
      </main>
    </div>
  );
}
