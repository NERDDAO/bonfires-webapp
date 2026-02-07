// TODO: Add type
// TODO: Move text to content folder
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
