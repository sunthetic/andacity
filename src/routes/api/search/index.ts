import type { RequestHandler } from "@builder.io/qwik-city";
import {
  loadIncrementalSearchResultsApiResponse,
  loadSearchResultsApiResponse,
} from "~/server/search/searchResultsApi";

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
  const response =
    url.searchParams.get("incremental") === "1"
      ? await loadIncrementalSearchResultsApiResponse(url)
      : await loadSearchResultsApiResponse(url);
  sendJson(headers, send, response.status, response.body);
};
