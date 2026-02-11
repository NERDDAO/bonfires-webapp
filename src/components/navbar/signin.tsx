"use client";

import Image from "next/image";

import {
  SignInButton,
  useAuth,
  useClerk,
  useOrganization,
  useOrganizationList,
  useUser,
} from "@clerk/nextjs";

import { Button } from "@/components/common/Button";

import { useIsMobile } from "@/hooks/useMediaQuery";

import { cn } from "@/lib/cn";

import Dropdown from "../ui/dropdown";

export default function Signin() {
  const isMobile = useIsMobile();
  const { isLoaded, isSignedIn, signOut, orgId } = useAuth();
  const { isLoaded: orgLoaded } = useOrganization();
  const { user } = useUser();
  const clerk = useClerk();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const profilePicture = user?.imageUrl;
  const email = user?.emailAddresses.find(
    (email) => email.id === user?.primaryEmailAddressId
  )?.emailAddress;

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-dark-s-900 skeleton" />;
  }

  if (isSignedIn) {
    return (
      <Dropdown
        placement={isMobile ? "center" : "end"}
        trigger={(open, onToggle) => (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "flex items-center gap-1.5 font-normal text-sm py-2 px-2 rounded-lg border-none bg-brand-black text-dark-s-0 hover:bg-dark-s-900 transition-colors duration-200",
              !isLoaded && "skeleton"
            )}
            disabled={!isLoaded}
            onClick={onToggle}
          >
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt="Profile Picture"
                width={20}
                height={20}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-dark-s-900" />
            )}

            <Image
              src="/icons/chevron-down.svg"
              alt="Chevron Down"
              width={20}
              height={20}
            />
          </Button>
        )}
        className="min-w-60"
      >
        <li
          role="menuitem"
          className="text-sm block px-4 py-2 text-dark-s-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-dark-s-0/50">Email Address</div>
          <span>{email}</span>
        </li>

        <li
          role="menuitem"
          className="text-sm block px-4 py-2 text-dark-s-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-dark-s-0/50 flex items-center gap-1">
            <span className="flex-1">Bonfires</span>
            <button
              type="button"
              className="cursor-pointer text-[1rem] block text-dark-s-0/60 hover:text-dark-s-0 transition-colors duration-200"
              onClick={() => {
                clerk?.openCreateOrganization();
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              +
            </button>
          </div>
          {userMemberships?.data && userMemberships.data.length > 1 && (
            <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {userMemberships.data.map((mem) => (
                <li key={mem.organization.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left text-xs py-1.5 px-2 rounded transition-colors duration-200",
                      orgId === mem.organization.id
                        ? "text-dark-s-0/80 bg-dark-s-900 cursor-default"
                        : "text-dark-s-0/70 hover:text-dark-s-0 hover:bg-dark-s-900/50 cursor-pointer"
                    )}
                    onClick={() => {
                      if (orgId !== mem.organization.id) {
                        setActive?.({ organization: mem.organization.id });
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={!orgLoaded}
                  >
                    {mem.organization.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>

        <div className="flex mt-2 justify-center mx-auto border-t border-[#3B1517] gap-4 py-2 bg-[#1A1C1F] rounded-b-lg">
          {[
            {
              icon: "/icons/settings.svg",
              alt: "Manage Account",
              onClick: () => {
                clerk?.openUserProfile();
              },
            },
            {
              icon: "/icons/building.svg",
              alt: "Manage Bonfire",
              onClick: () => {
                clerk?.openOrganizationProfile();
              },
            },
            {
              icon: "/icons/log-out.svg",
              alt: "Sign Out",
              onClick: () => {
                signOut();
              },
            },
          ].map((item) => (
            <button
              key={item.alt}
              onClick={item.onClick}
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                "rounded-lg text-sm p-2 text-dark-s-0 opacity-80 hover:opacity-100 cursor-pointer flex items-center justify-center"
              )}
            >
              <Image
                src={item.icon}
                alt={item.alt}
                width={20}
                height={20}
                className="w-4 h-4"
              />
            </button>
          ))}
        </div>
      </Dropdown>
    );
  }

  return null;
  // return (
  //   <SignInButton mode="modal">
  //     <Button
  //       type="button"
  //       variant="ghost"
  //       className={cn(
  //         "flex items-center gap-3 font-normal text-sm py-2 px-5 border border-[#3B1517] rounded-lg bg-brand-black text-dark-s-0 hover:bg-dark-s-900 transition-colors duration-200"
  //       )}
  //       disabled={!isLoaded}
  //     >
  //       Sign In
  //     </Button>
  //   </SignInButton>
  // );
}

/* Replaced with Custom Components */

// // Don't render until auth is loaded to prevent flash
// if (!isLoaded) {
//   return <div className="skeleton h-8 w-20 rounded-full" />;
// }

// if (!isSignedIn) {
//   return (
//     <SignInButton mode="modal">
//       <button className="btn btn-ghost btn-sm">Sign In</button>
//     </SignInButton>
//   );
// }

// return (
//   <>
//     <OrganizationSwitcher
//       hidePersonal={true}
//       afterSelectOrganizationUrl="/dashboard"
//       appearance={{
//         elements: {
//           // Trigger button styling for dark header
//           rootBox: "flex items-center",
//           organizationSwitcherTrigger:
//             "btn btn-ghost btn-sm normal-case gap-2 [&_*]:!text-base-content",
//           organizationSwitcherTriggerIcon: "!text-base-content",
//           // Dropdown - dark text on white background
//           organizationSwitcherPopoverCard: "[&_*]:!text-gray-900",
//         },
//       }}
//     />
//     <UserButton
//       afterSignOutUrl="/"
//       appearance={{
//         elements: {
//           avatarBox: "w-8 h-8",
//         },
//       }}
//     />
//   </>
// );
