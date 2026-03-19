import { buildSavedTravelerSummary } from "~/fns/saved-travelers/buildSavedTravelerSummary";
import { getSavedTravelerProfilesForUser } from "~/fns/saved-travelers/getSavedTravelerProfilesForUser";
import type {
  SavedTravelerProfile,
  SavedTravelerSummary,
} from "~/types/saved-travelers";

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export type SavedTravelersPageModel = {
  ownerUserId: string;
  header: {
    eyebrow: string;
    title: string;
    helper: string;
    countLabel: string;
  };
  stats: {
    activeCountLabel: string;
    archivedCountLabel: string;
    defaultTravelerLabel: string | null;
  };
  profiles: SavedTravelerProfile[];
  summaries: SavedTravelerSummary[];
  emptyState: {
    title: string;
    message: string;
  } | null;
};

export const getSavedTravelersPageModel = async (input: {
  ownerUserId: string;
}): Promise<SavedTravelersPageModel> => {
  const profiles = await getSavedTravelerProfilesForUser({
    ownerUserId: input.ownerUserId,
    includeArchived: true,
  });
  const summaries = profiles.map((profile) =>
    buildSavedTravelerSummary(profile),
  );
  const activeProfiles = profiles.filter(
    (profile) => profile.status === "active",
  );
  const archivedProfiles = profiles.filter(
    (profile) => profile.status === "archived",
  );
  const defaultTraveler =
    summaries.find((summary) => summary.isDefault) || null;

  return {
    ownerUserId: input.ownerUserId,
    header: {
      eyebrow: "Account-owned reusable traveler profiles",
      title: "Saved Travelers",
      helper:
        "Reuse canonical traveler details across future bookings without changing checkout-scoped booking records.",
      countLabel: pluralize(activeProfiles.length, "active profile"),
    },
    stats: {
      activeCountLabel: pluralize(activeProfiles.length, "active profile"),
      archivedCountLabel: pluralize(
        archivedProfiles.length,
        "archived profile",
      ),
      defaultTravelerLabel: defaultTraveler?.displayName || null,
    },
    profiles,
    summaries,
    emptyState: activeProfiles.length
      ? null
      : {
          title: "No saved travelers yet",
          message:
            "Profiles saved from checkout or created here will appear in this directory for future reuse.",
        },
  };
};
