import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { ResumeLoading } from "~/components/retrieval/ResumeLoading";
import { ResumeNotFound } from "~/components/retrieval/ResumeNotFound";
import { Page } from "~/components/site/Page";
import { getResumeRedirectUrl } from "~/fns/retrieval/getResumeRedirectUrl";
import { resolveResumeFlow } from "~/fns/retrieval/resolveResumeFlow";
import { getCurrentOwnershipContext } from "~/lib/ownership/getCurrentOwnershipContext";

const normalizeIncomingRef = (value: string) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

type ResumePageData = {
  kind: "not_found";
  incomingRef: string;
  reason: string;
};

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useResumePage = routeLoader$(async (event) => {
  const incomingRef = normalizeIncomingRef(String(event.params.ref || ""));

  const flow = await resolveResumeFlow({
    incomingRef,
    ownershipContext: getCurrentOwnershipContext(event, {
      ensureAnonymousSession: true,
    }),
  });

  const redirectUrl = getResumeRedirectUrl(flow.target, event.url);
  if (redirectUrl) {
    throw event.redirect(302, redirectUrl);
  }

  event.status(404);

  return {
    kind: "not_found",
    incomingRef: flow.incomingRef,
    reason: flow.target.reason,
  } satisfies ResumePageData;
});

export default component$(() => {
  const data = useResumePage().value;
  const location = useLocation();
  const pendingRef = normalizeIncomingRef(String(location.params.ref || ""));

  if (location.isNavigating) {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Resume" },
          { label: pendingRef || "Loading" },
        ]}
      >
        <ResumeLoading />
      </Page>
    );
  }

  return (
    <Page breadcrumbs={[{ label: "Home", href: "/" }, { label: "Resume" }]}>
      <ResumeNotFound
        message={
          data.incomingRef
            ? `We couldn't find a trip for reference ${data.incomingRef}.`
            : "We couldn't resolve this resume link."
        }
      />
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useResumePage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  return {
    title: "Resume link unavailable | Andacity",
    meta: [
      {
        name: "description",
        content: data.incomingRef
          ? `The resume link for ${data.incomingRef} could not be resolved.`
          : "The requested resume link could not be resolved.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
