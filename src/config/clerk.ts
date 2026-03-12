/**
 * Clerk localization overrides.
 *
 * SETUP: To enable wallet sign-in, configure Web3 auth in the Clerk Dashboard:
 *   1. Go to https://dashboard.clerk.com → your app
 *   2. Navigate to User & Authentication → Web3
 *   3. Enable MetaMask (and optionally Coinbase Wallet, OKX Wallet)
 *   4. Save — the <SignIn /> component will automatically render wallet options
 */
export const clerkLocalization = {
  organizationSwitcher: {
    action__manageOrganization: "Manage",
  },
  organizationProfile: {
    navbar: {
      title: "Bonfire",
      description: "Manage your bonfire.",
    },
    invitePage: {
      title: "Invite Members",
      subtitle: "Invite new members to this bonfire.",
    },
    start: {
      profileSection: {
        title: "Bonfire Profile",
      },
    },
    profilePage: {
      dangerSection: {
        leaveOrganization: {
          title: "Leave Bonfire",
          messageLine1:
            "Are you sure you want to leave this bonfire? You will lose access to this bonfire and its applications.",
          messageLine2: "This action is permanent and irreversible.",
          successMessage: "You have left the bonfire.",
          actionDescription: 'Type "{{organizationName}}" below to continue.',
        },
        deleteOrganization: {
          title: "Delete Bonfire",
          messageLine1: "Are you sure you want to delete this bonfire?",
          messageLine2: "This action is permanent and irreversible.",
          successMessage: "You have deleted the bonfire.",
          actionDescription: 'Type "{{organizationName}}" below to continue.',
        },
        title: "Danger",
      },
    },
  },
  organizationList: {
    title: "Select a Bonfire",
    subtitle: "Select a bonfire to continue.",
    action__createOrganization: "Create Bonfire",
    titleWithoutPersonal: "Choose a bonfire",
  },
  createOrganization: {
    title: "Create Bonfire",
    subtitle: "Set up a new bonfire.",
    formButtonSubmit: "Create bonfire",
  },
};
