/**
 * Bonfire Settings Page
 *
 * Organization profile page for Bonfire Managers to:
 * - Invite users to their bonfire
 * - Manage member roles (promote/demote)
 * - View and manage organization settings
 *
 * Access: Only org:bonfire_manager and org:bonfire_admin roles
 */
import { redirect } from "next/navigation";

import { OrganizationProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { Header } from "@/components/shared/Header";

export default async function BonfireSettingsPage() {
  const { orgRole } = await auth();

  // Only managers and admins can access bonfire settings
  if (orgRole !== "org:bonfire_manager" && orgRole !== "org:bonfire_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bonfire Settings</h1>
          <p className="text-base-content/60 mt-1">
            Manage your bonfire members and settings
          </p>
        </div>
        <OrganizationProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-base-300",
            },
          }}
        />
      </main>
    </div>
  );
}
