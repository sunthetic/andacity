import { component$ } from "@builder.io/qwik";
import { HotelResultCard } from "~/components/search/hotels/HotelResultCard";
import type { HotelResultCardModel } from "~/types/search-ui";

export const HotelResultsList = component$((props: HotelResultsListProps) => {
  return (
    <div class="grid gap-4" aria-label="Hotel search results">
      {props.cards.map((card) => (
        <HotelResultCard key={card.id} card={card} />
      ))}
    </div>
  );
});

type HotelResultsListProps = {
  cards: HotelResultCardModel[];
};
