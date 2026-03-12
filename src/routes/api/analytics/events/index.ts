import type { RequestHandler } from "@builder.io/qwik-city";

type AnalyticsEventPayload = {
  name?: unknown;
  occurredAt?: unknown;
  path?: unknown;
  payload?: unknown;
};

const sendEmpty = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status = 204,
) => {
  headers.set("cache-control", "no-store");
  send(status, "");
};

export const onPost: RequestHandler = async ({
  request,
  headers,
  send,
}) => {
  const body = (await request.json().catch(() => null)) as AnalyticsEventPayload | null;

  if (!body || typeof body !== "object") {
    sendEmpty(headers, send, 400);
    return;
  }

  const name = String(body.name || "").trim();
  const path = String(body.path || "").trim();

  if (!name || !path) {
    sendEmpty(headers, send, 400);
    return;
  }

  console.info(
    "[andacity.analytics]",
    JSON.stringify({
      kind: "booking-event",
      name,
      occurredAt:
        String(body.occurredAt || "").trim() || new Date().toISOString(),
      path,
      payload:
        body.payload && typeof body.payload === "object" ? body.payload : {},
    }),
  );

  sendEmpty(headers, send);
};

