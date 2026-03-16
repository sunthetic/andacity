import type { RequestHandler } from "@builder.io/qwik-city";
import { loadSearchResultsApiResponse } from "~/server/search/searchResultsApi";

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
  cacheControl = "no-store",
) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", cacheControl);
  send(status, JSON.stringify(body));
};

export const onGet: RequestHandler = async ({ headers, send, url }) => {
  const response = await loadSearchResultsApiResponse(url);
  sendJson(headers, send, response.status, response.body);
};
