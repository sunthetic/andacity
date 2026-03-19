import type { RequestEventBase } from "@builder.io/qwik-city";
import { getAnonymousOwnershipSessionId } from "~/lib/ownership/getAnonymousOwnershipSessionId";
import {
  OWNERSHIP_CLAIMS_COOKIE,
  OWNERSHIP_USER_COOKIE,
  toNullableText,
} from "~/lib/ownership/shared";
import type { CurrentOwnershipContext } from "~/types/ownership";

const readClaimTokenCookie = (
  event: Pick<RequestEventBase, "cookie">,
): Record<string, string> => {
  try {
    const raw = event.cookie.get(OWNERSHIP_CLAIMS_COOKIE);
    const parsed = raw?.json<Record<string, unknown>>() || {};

    return Object.entries(parsed).reduce<Record<string, string>>(
      (acc, [itineraryRef, claimToken]) => {
        const nextRef = String(itineraryRef || "").trim().toUpperCase();
        const nextToken = String(claimToken || "").trim();

        if (nextRef && nextToken) {
          acc[nextRef] = nextToken;
        }

        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const persistOwnershipClaimToken = (
  event: Pick<RequestEventBase, "cookie" | "url">,
  itineraryRef: string,
  claimToken: string,
) => {
  const nextRef = String(itineraryRef || "").trim().toUpperCase();
  const nextToken = String(claimToken || "").trim();

  if (!nextRef || !nextToken) return;

  const claims = readClaimTokenCookie(event);
  const nextClaims = {
    ...claims,
    [nextRef]: nextToken,
  };

  event.cookie.set(OWNERSHIP_CLAIMS_COOKIE, nextClaims, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: [180, "days"],
    secure: event.url.protocol === "https:",
  });
};

export const clearOwnershipClaimToken = (
  event: Pick<RequestEventBase, "cookie" | "url">,
  itineraryRef: string,
) => {
  const nextRef = String(itineraryRef || "").trim().toUpperCase();
  if (!nextRef) return;

  const claims = readClaimTokenCookie(event);
  if (!claims[nextRef]) return;

  delete claims[nextRef];
  event.cookie.set(OWNERSHIP_CLAIMS_COOKIE, claims, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: [180, "days"],
    secure: event.url.protocol === "https:",
  });
};

export const getCurrentOwnershipContext = (
  event: Pick<RequestEventBase, "cookie" | "request" | "sharedMap" | "url">,
  options: {
    ensureAnonymousSession?: boolean;
  } = {},
): CurrentOwnershipContext => {
  const sharedUserId = toNullableText(event.sharedMap.get("currentUserId"));
  const headerUserId = toNullableText(
    event.request.headers.get("x-andacity-user-id"),
  );
  const cookieUserId = toNullableText(
    event.cookie.get(OWNERSHIP_USER_COOKIE)?.value,
  );
  const ownerUserId = sharedUserId || headerUserId || cookieUserId;

  return {
    ownerUserId,
    ownerSessionId: getAnonymousOwnershipSessionId(event, {
      createIfMissing: !ownerUserId && options.ensureAnonymousSession,
    }),
    claimTokensByItineraryRef: readClaimTokenCookie(event),
  };
};
