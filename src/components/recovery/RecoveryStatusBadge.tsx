import { component$ } from "@builder.io/qwik";
import type { RecoverySeverity, RecoveryStage } from "~/types/recovery";

const stageLabel = (stage: RecoveryStage) => {
  if (stage === "revalidation") return "Revalidation";
  return `${stage.slice(0, 1).toUpperCase()}${stage.slice(1)}`;
};

const severityLabel = (severity: RecoverySeverity) => {
  return `${severity.slice(0, 1).toUpperCase()}${severity.slice(1)}`;
};

const classesForSeverity = (severity: RecoverySeverity) => {
  if (severity === "critical") {
    return "border-[color:rgba(127,29,29,0.24)] bg-[color:rgba(254,226,226,0.96)] text-[color:#991b1b]";
  }

  if (severity === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)] text-[color:#b91c1c]";
  }

  if (severity === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)] text-[color:#92400e]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)] text-[color:#1d4ed8]";
};

export const RecoveryStatusBadge = component$(
  (props: { severity: RecoverySeverity; stage: RecoveryStage }) => {
    return (
      <span
        class={[
          "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
          classesForSeverity(props.severity),
        ]}
      >
        {stageLabel(props.stage)} · {severityLabel(props.severity)}
      </span>
    );
  },
);
