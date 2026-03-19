import { getPrimaryRecoveryAction } from "~/fns/recovery/getPrimaryRecoveryAction";
import { getRecoveryActions } from "~/fns/recovery/getRecoveryActions";
import { getRecoveryDisplayCopy } from "~/fns/recovery/getRecoveryDisplayCopy";
import { getSecondaryRecoveryActions } from "~/fns/recovery/getSecondaryRecoveryActions";
import { isRecoveryRetryable } from "~/fns/recovery/isRecoveryRetryable";
import type {
  RecoveryMetadata,
  RecoveryStage,
  RecoveryState,
  RecoverySummary,
} from "~/types/recovery";

export const buildRecoveryState = (input: {
  stage: RecoveryStage;
  reasonCode: RecoveryState["reasonCode"];
  metadata?: RecoveryMetadata;
}): RecoveryState => {
  const metadata = input.metadata || {};
  const display = getRecoveryDisplayCopy({
    stage: input.stage,
    reasonCode: input.reasonCode,
    metadata,
  });
  const actions = getRecoveryActions({
    stage: input.stage,
    reasonCode: input.reasonCode,
    metadata,
  });

  return {
    stage: input.stage,
    severity: display.severity,
    reasonCode: input.reasonCode,
    title: display.title,
    message: display.message,
    actions,
    isRetryable: isRecoveryRetryable(input.reasonCode),
    isTerminal: display.isTerminal,
    metadata,
  };
};

export const buildRecoverySummary = (
  recoveryState: RecoveryState | null,
  stage: RecoveryStage,
): RecoverySummary => {
  return {
    stage,
    state: recoveryState,
    primaryAction: getPrimaryRecoveryAction(recoveryState),
    secondaryActions: getSecondaryRecoveryActions(recoveryState),
  };
};
