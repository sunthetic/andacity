import type { RequestHandler } from "@builder.io/qwik-city";

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
  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
  } | null;
  const path = String(body?.path || "").trim();

  if (!path) {
    sendEmpty(headers, send, 400);
    return;
  }

  console.info(
    "[andacity.analytics]",
    JSON.stringify({
      kind: "pageview",
      path,
      occurredAt: new Date().toISOString(),
    }),
  );

  sendEmpty(headers, send);
};
