import type { RequestEventBase } from "@builder.io/qwik-city";
import {
  createAnonymousOwnershipSessionId,
  OWNERSHIP_SESSION_COOKIE,
  toNullableText,
} from "~/lib/ownership/shared";

export const getAnonymousOwnershipSessionId = (
  event: Pick<RequestEventBase, "cookie" | "url">,
  options: {
    createIfMissing?: boolean;
  } = {},
) => {
  const existing = toNullableText(
    event.cookie.get(OWNERSHIP_SESSION_COOKIE)?.value,
  );

  if (existing || !options.createIfMissing) {
    return existing;
  }

  const sessionId = createAnonymousOwnershipSessionId();
  event.cookie.set(OWNERSHIP_SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: [180, "days"],
    secure: event.url.protocol === "https:",
  });

  return sessionId;
};
