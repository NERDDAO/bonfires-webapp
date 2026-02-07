/**
 * Sign In Page
 *
 * Clerk-powered sign-in page with email/password and Google OAuth.
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <SignIn />
    </div>
  );
}
