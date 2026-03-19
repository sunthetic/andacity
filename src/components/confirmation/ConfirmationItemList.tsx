import { component$ } from "@builder.io/qwik";
import { ConfirmationItemCard } from "~/components/confirmation/ConfirmationItemCard";
import type { ConfirmationPageItemModel } from "~/lib/confirmation/getConfirmationPageModel";

export const ConfirmationItemList = component$(
  (props: { items: ConfirmationPageItemModel[] }) => {
    return (
      <div class="space-y-3">
        {props.items.map((item) => (
          <ConfirmationItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  },
);
