import type { RecoveryAction, RecoveryState } from "~/types/recovery";

export const getSecondaryRecoveryActions = (
  recoveryState: Pick<RecoveryState, "actions"> | null | undefined,
): RecoveryAction[] => {
  if (!recoveryState) return [];

  const primary = recoveryState.actions.find(
    (action) => action.emphasis === "primary" && !action.disabled,
  );

  return recoveryState.actions.filter((action) => {
    if (action.disabled) return false;
    if (!primary) return action.emphasis !== "primary";
    return action.type !== primary.type || action.emphasis !== primary.emphasis;
  });
};
