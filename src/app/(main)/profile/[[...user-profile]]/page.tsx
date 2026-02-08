/**
 * User Profile Page
 *
 * Clerk-powered user profile page for:
 * - Managing account settings (email, password)
 * - Viewing connected accounts (Google, etc.)
 * - Future: Linking Web3 wallets
 */
import { UserProfile } from "@clerk/nextjs";

import { Header } from "@/components/shared/Header";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-base-content/60 mt-1">
            Manage your profile and connected accounts
          </p>
        </div>
        <UserProfile
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
