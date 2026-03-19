import { component$ } from "@builder.io/qwik";
import { SavedTravelerCard } from "~/components/travelers/SavedTravelerCard";
import type {
  SavedTravelerProfile,
  SavedTravelerSummary,
} from "~/types/saved-travelers";

export const SavedTravelersList = component$(
  (props: {
    travelers: SavedTravelerProfile[];
    summaries: SavedTravelerSummary[];
  }) => {
    const summariesById = new Map(
      props.summaries.map((summary) => [summary.id, summary]),
    );

    return (
      <div class="space-y-4">
        {props.travelers.map((traveler) => {
          const summary = summariesById.get(traveler.id);
          if (!summary) return null;

          return (
            <SavedTravelerCard
              key={traveler.id}
              traveler={traveler}
              summary={summary}
            />
          );
        })}
      </div>
    );
  },
);
