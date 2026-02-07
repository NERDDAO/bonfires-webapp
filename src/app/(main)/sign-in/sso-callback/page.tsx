import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * SSO callback page for Clerk OAuth (e.g. "Continue with Google").
 * Renders after the user returns from the identity provider.
 */
export default function SSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback continueSignUpUrl="/sign-in/continue" />
      {/* Required for sign-up flows – Clerk's bot sign-up protection */}
      <div id="clerk-captcha" />
    </>
  );
}
