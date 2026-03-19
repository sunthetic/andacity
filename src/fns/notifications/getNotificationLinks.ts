import { getServerRuntimeEnvValue } from "~/lib/server/runtime-env.server";
import type { OwnershipMode } from "~/types/ownership";
import type { NotificationLinks } from "~/types/notifications";

const getBaseUrl = () => {
  const configured = String(getServerRuntimeEnvValue("PUBLIC_BASE_URL") || "").trim();
  if (!configured) return "https://andacity.com";

  try {
    return new URL(configured).origin;
  } catch {
    return "https://andacity.com";
  }
};

const toAbsoluteUrl = (path: string | null) => {
  if (!path) return null;
  return new URL(path, getBaseUrl()).toString();
};

export const getNotificationLinks = (input: {
  confirmationRef?: string | null;
  itineraryRef?: string | null;
  ownershipMode?: OwnershipMode | null;
  includeClaimFlow?: boolean;
}): NotificationLinks => {
  const confirmationRef = String(input.confirmationRef || "").trim().toUpperCase();
  const itineraryRef = String(input.itineraryRef || "").trim().toUpperCase();

  const confirmationPath = confirmationRef
    ? `/confirmation/${encodeURIComponent(confirmationRef)}`
    : null;
  const itineraryPath = itineraryRef
    ? `/itinerary/${encodeURIComponent(itineraryRef)}`
    : null;
  const resumeRef = itineraryRef || confirmationRef;
  const resumePath = resumeRef
    ? `/resume/${encodeURIComponent(resumeRef)}`
    : null;
  const claimPath =
    input.includeClaimFlow && itineraryRef
      ? `/itinerary/${encodeURIComponent(itineraryRef)}?resume=claim`
      : null;

  return {
    confirmationUrl: toAbsoluteUrl(confirmationPath),
    itineraryUrl: toAbsoluteUrl(itineraryPath),
    resumeUrl: toAbsoluteUrl(resumePath),
    claimUrl:
      input.includeClaimFlow || input.ownershipMode === "anonymous"
        ? toAbsoluteUrl(claimPath || itineraryPath)
        : null,
  };
};
