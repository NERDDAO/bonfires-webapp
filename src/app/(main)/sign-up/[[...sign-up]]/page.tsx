/**
 * Sign Up Page
 *
 * Clerk-powered sign-up page with email/password and Google OAuth.
 */
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <SignUp />
    </div>
  );
}
