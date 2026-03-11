/**
 * Sign In Page
 *
 * Clerk-powered sign-in page with email/password, Google OAuth, and Web3 wallet.
 * Wallet sign-in (MetaMask etc.) is auto-rendered when enabled in the Clerk Dashboard
 * under User & Authentication > Web3. See config/clerk.ts for setup instructions.
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <SignIn />
    </div>
  );
}
