import { OrganizationSwitcher, SignInButton, UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

/**
 * Authentication section of the header
 * Shows sign-in button when not authenticated,
 * or organization switcher and user button when authenticated.
 */
export function AuthSection() {
  const { isSignedIn, isLoaded } = useAuth();

  // Don't render until auth is loaded to prevent flash
  if (!isLoaded) {
    return <div className="skeleton h-8 w-20 rounded-full" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="btn btn-ghost btn-sm">Sign In</button>
      </SignInButton>
    );
  }

  return (
    <>
      <OrganizationSwitcher
        hidePersonal={true}
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            // Trigger button styling for dark header
            rootBox: "flex items-center",
            organizationSwitcherTrigger:
              "btn btn-ghost btn-sm normal-case gap-2 [&_*]:!text-base-content",
            organizationSwitcherTriggerIcon: "!text-base-content",
            // Dropdown - dark text on white background
            organizationSwitcherPopoverCard: "[&_*]:!text-gray-900",
          },
        }}
      />
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    </>
  );
}
