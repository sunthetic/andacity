import { component$ } from "@builder.io/qwik";
import {
  CardSkeleton,
  ListSkeleton,
} from "~/components/async/AsyncSurfaceSkeleton";

export const ResultsLoading = component$((props: ResultsLoadingProps) => {
  if (props.variant === "card") {
    const count = props.count || 6;

    return (
      <div class="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={`card-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return <ListSkeleton count={props.count} />;
});

type ResultsLoadingProps = {
  variant?: "card" | "list";
  count?: number;
};
