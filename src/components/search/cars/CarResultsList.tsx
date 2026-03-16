import { component$ } from "@builder.io/qwik";
import { CarResultCard } from "~/components/search/cars/CarResultCard";
import type { CarResultCardModel } from "~/types/search-ui";

export const CarResultsList = component$((props: CarResultsListProps) => {
  return (
    <div class="grid gap-4" aria-label="Car search results">
      {props.cards.map((card) => (
        <CarResultCard key={card.id} card={card} />
      ))}
    </div>
  );
});

type CarResultsListProps = {
  cards: CarResultCardModel[];
};
