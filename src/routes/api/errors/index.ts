import type { RequestHandler } from "@builder.io/qwik-city";

type ErrorPayload = {
  kind?: unknown;
  message?: unknown;
  filename?: unknown;
  lineno?: unknown;
  colno?: unknown;
  reason?: unknown;
  occurredAt?: unknown;
};

const sendEmpty = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status = 204,
) => {
  headers.set("cache-control", "no-store");
  send(status, "");
};

export const onPost: RequestHandler = async ({ request, headers, send }) => {
  const body = (await request.json().catch(() => null)) as ErrorPayload | null;

  if (!body || typeof body !== "object") {
    sendEmpty(headers, send, 400);
    return;
  }

  const kind = String(body.kind || "").trim();
  if (!kind) {
    sendEmpty(headers, send, 400);
    return;
  }

  const occurredAt =
    String(body.occurredAt || "").trim() || new Date().toISOString();

  const entry: Record<string, unknown> = { kind, occurredAt };

  if (kind === "unhandled-error") {
    const message = String(body.message || "").slice(0, 500);
    const filename = String(body.filename || "").slice(0, 200);
    if (message) entry.message = message;
    if (filename) entry.filename = filename;
    if (typeof body.lineno === "number") entry.lineno = body.lineno;
    if (typeof body.colno === "number") entry.colno = body.colno;
  } else if (kind === "unhandled-rejection") {
    const reason = String(body.reason || "").slice(0, 500);
    if (reason) entry.reason = reason;
  }

  console.error("[andacity.errors]", JSON.stringify(entry));

  sendEmpty(headers, send);
};
