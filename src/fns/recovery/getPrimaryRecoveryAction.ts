import type { RecoveryAction, RecoveryState } from "~/types/recovery";

export const getPrimaryRecoveryAction = (
  recoveryState: Pick<RecoveryState, "actions"> | null | undefined,
): RecoveryAction | null => {
  if (!recoveryState) return null;
  return (
    recoveryState.actions.find(
      (action) => action.emphasis === "primary" && !action.disabled,
    ) ||
    recoveryState.actions.find((action) => !action.disabled) ||
    null
  );
};
