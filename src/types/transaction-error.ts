import type { RecoveryReasonCode, RecoveryStage } from "~/types/recovery";

export type TransactionErrorCode =
  | RecoveryReasonCode
  | "UNKNOWN_TRANSACTION_ERROR";

export type TransactionError = {
  code: TransactionErrorCode;
  stage: RecoveryStage;
  message: string;
  retryable: boolean;
  safeUserMessage: string;
  details: Record<string, unknown> | null;
};
