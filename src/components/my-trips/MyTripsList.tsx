import { component$ } from "@builder.io/qwik";
import { MyTripsCard } from "~/components/my-trips/MyTripsCard";
import type { MyTripsGroupModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsList = component$(
  (props: { trips: MyTripsGroupModel["trips"] }) => {
    return (
      <div class="space-y-4">
        {props.trips.map((trip) => (
          <MyTripsCard key={trip.publicRef} trip={trip} />
        ))}
      </div>
    );
  },
);
