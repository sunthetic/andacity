type JsonSend = (status: number, body: string) => void;

type SendJsonOptions = {
  cacheControl?: string | null;
};

const toText = (value: unknown) => String(value ?? "").trim();

const readNestedCauseMessage = (error: unknown, depth = 0): string | null => {
  if (depth > 6 || !error || typeof error !== "object") {
    return null;
  }

  const cause = "cause" in error ? error.cause : undefined;
  if (!cause) {
    return null;
  }

  const nestedMessage = readNestedCauseMessage(cause, depth + 1);
  if (nestedMessage) {
    return nestedMessage;
  }

  if (cause instanceof Error) {
    return toText(cause.message) || null;
  }

  if (
    typeof cause === "object" &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return toText(cause.message) || null;
  }

  return null;
};

export const sendJson = (
  headers: Headers,
  send: JsonSend,
  status: number,
  body: unknown,
  options: SendJsonOptions = {},
) => {
  headers.set("content-type", "application/json; charset=utf-8");

  if (typeof options.cacheControl === "string" && options.cacheControl.trim()) {
    headers.set("cache-control", options.cacheControl);
  }

  send(status, JSON.stringify(body));
};

export const readApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  const nestedCauseMessage = readNestedCauseMessage(error);
  if (nestedCauseMessage) {
    return nestedCauseMessage;
  }

  if (error instanceof Error) {
    const message = toText(error.message);
    if (message) {
      return message;
    }
  }

  return fallbackMessage;
};

export const sendApiServerError = (
  headers: Headers,
  send: JsonSend,
  error: unknown,
  fallbackMessage: string,
  options: SendJsonOptions & {
    label?: string;
    body?: Record<string, unknown>;
  } = {},
) => {
  console.error(options.label ? `[${options.label}]` : "[api-error]", error);

  sendJson(
    headers,
    send,
    500,
    {
      ...(options.body || {}),
      error: readApiErrorMessage(error, fallbackMessage),
    },
    options,
  );
};
