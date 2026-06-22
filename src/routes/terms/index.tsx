// TODO: Legal review recommended before full commercial launch.
import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'

const LAST_UPDATED = '2026-06-21'

export default component$(() => {
  return (
    <Page breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}>
      <div class="max-w-3xl">
        <h1
          class="text-balance"
          style="color:var(--ui-text);font-size:1.875rem;font-weight:700;letter-spacing:-0.02em;line-height:1.2"
        >
          Terms of Service
        </h1>
        <p class="mt-2 text-sm" style="color:var(--ui-text-muted)">
          Last updated: {LAST_UPDATED} · Public beta
        </p>

        <div class="mt-8 space-y-8 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">About These Terms</h2>
            <p>
              These Terms of Service ("Terms") govern your use of Andacity, a travel search and
              planning tool operated by Sunthetic Media. By using Andacity, you agree to these Terms.
            </p>
            <p class="mt-3">
              Andacity is currently in public beta. Features, availability, and these Terms may
              change as the product develops. We will notify users of material changes by updating
              the "last updated" date above.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">What Andacity Does</h2>
            <p>
              Andacity is a travel search and comparison tool. We help you discover and compare
              flights, hotels, and car rentals. Andacity is a search and discovery service — we
              are not a travel agency, airline, hotel, or car rental company, and we are not the
              merchant of record for any booking.
            </p>
            <p class="mt-3">
              When you follow a link to book travel on a third-party provider's site, your
              transaction is with that provider. Their own terms, cancellation policies, and
              pricing govern the booking. Andacity does not control and is not responsible for
              the accuracy of availability or pricing shown by third-party providers.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Eligibility</h2>
            <p>
              You must be at least 18 years old to use Andacity. By using the service, you
              represent that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul class="mt-2 list-inside list-disc space-y-1">
              <li>Use automated tools to scrape or systematically copy content from Andacity without permission</li>
              <li>Attempt to access systems or data you are not authorized to access</li>
              <li>Use Andacity in any way that violates applicable law</li>
              <li>Misrepresent your identity or affiliation when contacting us</li>
            </ul>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">No Guarantees on Results</h2>
            <p>
              Andacity displays search results sourced from third-party providers. We do not
              guarantee the accuracy, completeness, or availability of any search result. Prices
              and availability change frequently and are ultimately determined by the provider.
            </p>
            <p class="mt-3">
              Always confirm final pricing, availability, and cancellation terms directly with
              the provider before completing any booking.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Affiliate Relationships</h2>
            <p>
              Andacity may earn a commission from select partner bookings made through links on
              our site, at no additional cost to you. This does not affect the prices you see or
              the order of search results.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Intellectual Property</h2>
            <p>
              The Andacity name, logo, and site design are owned by Sunthetic Media. You may
              not reproduce or redistribute Andacity content without permission. Search results
              displayed on Andacity include data licensed from or provided by third-party
              travel data providers under their respective terms.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Beta Disclaimer</h2>
            <p>
              Andacity is provided "as is" during the public beta period. Features may be
              incomplete, temporarily unavailable, or change without notice. We make no
              warranty of uptime, accuracy, or fitness for a particular purpose during beta.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Sunthetic Media and Andacity are not
              liable for any indirect, incidental, or consequential damages arising from your
              use of the service, including losses related to bookings made through third-party
              providers.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of Andacity after a change
              is posted constitutes acceptance of the updated Terms. If you do not agree to the
              updated Terms, please stop using the service.
            </p>
          </section>

          <section>
            <h2 class="mb-2 text-base font-semibold" style="color:var(--ui-text)">Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
              <a
                href="mailto:legal@andacity.com"
                class="underline underline-offset-2"
                style="color:var(--ui-link)"
              >
                legal@andacity.com
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
  const title = 'Terms of Service | Andacity Travel'
  const description =
    'Read the Andacity Terms of Service governing your use of our travel search and planning tool.'
  const canonicalHref = new URL('/terms', url.origin).href

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
