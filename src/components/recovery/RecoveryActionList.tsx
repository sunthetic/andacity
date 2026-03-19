import { component$ } from "@builder.io/qwik";
import type { RecoveryAction } from "~/types/recovery";

const primaryClasses =
  "rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90";
const secondaryClasses =
  "rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]";
const disabledClasses =
  "cursor-not-allowed rounded-lg border border-[color:var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70";

export const RecoveryActionList = component$(
  (props: { actions: RecoveryAction[]; class?: string }) => {
    const actions = props.actions.filter((action) => !action.disabled);
    if (!actions.length) return null;

    return (
      <div class={["flex flex-wrap gap-3", props.class]}>
        {actions.map((action, index) => {
          const classes = action.disabled
            ? disabledClasses
            : index === 0 || action.emphasis === "primary"
              ? primaryClasses
              : secondaryClasses;

          if (action.href) {
            return (
              <a
                key={`${action.type}-${index}`}
                href={action.href}
                class={classes}
              >
                {action.label}
              </a>
            );
          }

          if (action.intent) {
            return (
              <form key={`${action.type}-${index}`} method="post">
                <input type="hidden" name="intent" value={action.intent} />
                <button type="submit" class={classes}>
                  {action.label}
                </button>
              </form>
            );
          }

          return (
            <span key={`${action.type}-${index}`} class={classes}>
              {action.label}
            </span>
          );
        })}
      </div>
    );
  },
);
