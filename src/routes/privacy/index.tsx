// TODO: Legal review recommended before full commercial launch.
import { component$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'

const LAST_UPDATED = '2026-06-22'

export const usePrivacyConfig = routeLoader$(({ env }) => ({
  email: env.get('PRIVACY_EMAIL') || 'privacy@andacity.com',
}))

export default component$(() => {
  const config = usePrivacyConfig()
  const email = config.value.email

  return (
    <Page breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}>
      <div class="max-w-3xl">
        <h1
          class="text-balance"
          style="color:var(--ui-text);font-size:1.875rem;font-weight:700;letter-spacing:-0.02em;line-height:1.2"
        >
          Privacy Policy
        </h1>
        <p class="mt-2 text-sm" style="color:var(--ui-text-muted)">
          Last updated: {LAST_UPDATED} · Public beta
        </p>

        <div class="mt-8 space-y-8 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">About Andacity</h2>
            <p>
              Andacity is a travel planning tool that helps you search, compare, and organize
              flights, hotels, and car rentals in one place. We are currently in public beta. This
              Privacy Policy describes what information we collect, how we use it, and what choices
              you have.
            </p>
            <p class="mt-3">
              Because Andacity is in public beta, our data practices may evolve as the product
              develops. We will update this policy when meaningful changes occur and revise the
              "last updated" date above.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Information We Collect</h2>
            <p class="font-medium" style="color:var(--ui-text)">Server access logs</p>
            <p class="mt-1">
              When you use Andacity, our servers automatically record standard access log information
              including the URL you requested, your IP address, browser type, and the time of your
              request. This is a standard part of how web servers operate.
            </p>

            <p class="mt-4 font-medium" style="color:var(--ui-text)">Pageview analytics</p>
            <p class="mt-1">
              We record page navigation server-side when you move between pages on Andacity.
              Depending on the deployment configuration, we may also use a third-party analytics
              provider to understand aggregate traffic patterns. The following providers are
              supported:
            </p>
            <ul class="mt-2 list-inside list-disc space-y-1">
              <li>
                <span class="font-medium" style="color:var(--ui-text)">First-party logging only (default):</span>{' '}
                No third-party service is contacted, no cookies are set for analytics, and no data
                is sent to external services.
              </li>
              <li>
                <span class="font-medium" style="color:var(--ui-text)">Cloudflare Web Analytics (optional):</span>{' '}
                A cookieless, privacy-preserving analytics service. Page path and aggregate browser
                metadata are sent to Cloudflare. No cookies are set for this provider.
              </li>
              <li>
                <span class="font-medium" style="color:var(--ui-text)">Google Analytics 4 (optional):</span>{' '}
                A third-party analytics service provided by Google. If active, GA4 sets analytics
                cookies and sends page path and standard browser metadata to Google. A cookie
                disclosure banner may be required in your jurisdiction if GA4 is enabled.
              </li>
            </ul>
            <p class="mt-3">
              We do not use analytics data for targeted advertising. Contact us if you have
              questions about which provider is currently active on this deployment.
            </p>

            <p class="mt-4 font-medium" style="color:var(--ui-text)">Search queries</p>
            <p class="mt-1">
              Search queries (destinations, dates, passenger counts) are passed as URL parameters
              and processed to return results. We do not store your search history in a user profile.
              Searches may appear in server access logs as part of the URL.
            </p>

            <p class="mt-4 font-medium" style="color:var(--ui-text)">Contact information</p>
            <p class="mt-1">
              If you contact us directly (e.g., by email), we will receive and store the information
              you provide in order to respond.
            </p>

            <p class="mt-4 font-medium" style="color:var(--ui-text)">Error reports</p>
            <p class="mt-1">
              If your browser encounters an unhandled JavaScript error, a minimal error report
              (error message, script filename, and line number) is sent to our server for
              operational logging. These reports do not include personal data such as names,
              email addresses, or payment information.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Information We Do Not Collect</h2>
            <ul class="mt-1 list-inside list-disc space-y-1">
              <li>Payment or billing information — purchases are processed by third-party booking providers</li>
              <li>Account credentials — Andacity currently has no account or login system</li>
              <li>Precise location data — we do not request GPS or device location access</li>
              <li>Cookies set for tracking — no persistent tracking cookies are set unless Google Analytics 4 is the active analytics provider</li>
            </ul>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">How We Use Information</h2>
            <ul class="mt-1 list-inside list-disc space-y-1">
              <li>To operate the service and return search results</li>
              <li>To understand how the site is used and improve it</li>
              <li>To diagnose errors and maintain reliability</li>
              <li>To respond to contact requests</li>
            </ul>
            <p class="mt-3">
              We do not sell personal information. We do not use server log data for targeted
              advertising.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Third-Party Providers and Affiliate Links</h2>
            <p>
              Andacity displays flights, hotels, and car rentals sourced from third-party providers.
              When you follow a link to book with a provider, you are leaving Andacity and are
              subject to that provider's own privacy policy and terms. We may earn a commission
              from select partner bookings at no extra cost to you.
            </p>
            <p class="mt-3">
              We do not share personal data with affiliate partners beyond what is carried in the
              URL of any outbound booking link.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Data Security</h2>
            <p>
              We use HTTPS to encrypt data in transit. Access to server infrastructure is
              restricted. However, no system is completely secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Children's Privacy</h2>
            <p>
              Andacity is not directed at children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have inadvertently collected
              such information, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Changes to This Policy</h2>
            <p>
              We will update this policy as our practices change. The "last updated" date at the top
              of this page reflects the most recent revision. Continued use of Andacity after a
              policy update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a
                href={`mailto:${email}`}
                class="underline underline-offset-2"
                style="color:var(--ui-link)"
              >
                {email}
              </a>
              {' '}or visit our{' '}
              <a href="/contact" class="underline underline-offset-2" style="color:var(--ui-link)">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Privacy Policy | Andacity Travel'
  const description =
    'Read the Andacity Privacy Policy to understand how we handle data on our travel search platform.'
  const canonicalHref = new URL('/privacy', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
