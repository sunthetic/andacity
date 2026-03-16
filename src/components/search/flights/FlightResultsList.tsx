import { component$ } from "@builder.io/qwik";
import { FlightResultCard } from "~/components/search/flights/FlightResultCard";
import type { FlightResultCardModel } from "~/types/search-ui";

export const FlightResultsList = component$((props: FlightResultsListProps) => {
  return (
    <div class="grid gap-4" aria-label="Flight search results">
      {props.cards.map((card) => (
        <FlightResultCard key={card.id} card={card} />
      ))}
    </div>
  );
});

type FlightResultsListProps = {
  cards: FlightResultCardModel[];
};
