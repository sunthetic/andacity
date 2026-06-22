// Contact email is a configurable placeholder. Set CONTACT_EMAIL in production config
// or replace the href/text below before full commercial launch.
import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'

const CONTACT_EMAIL = 'hello@andacity.com'

const TOPICS = [
  {
    title: 'General questions',
    description:
      'Anything about how Andacity works, what features are available, or how to use the site.',
  },
  {
    title: 'Booking and provider questions',
    description:
      'Questions about a booking you made through a third-party provider linked from Andacity. Note that Andacity is not the booking provider — for changes, cancellations, or refunds, contact the airline, hotel, or car rental company directly.',
  },
  {
    title: 'Site feedback',
    description:
      'Found a bug, have a suggestion, or spotted something that looks wrong? We read everything.',
  },
  {
    title: 'Privacy and legal requests',
    description:
      'Questions about your data, requests to access or delete data, or inquiries about our Privacy Policy or Terms of Service.',
  },
]

export default component$(() => {
  return (
    <Page breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}>
      <div class="max-w-2xl">
        <h1
          class="text-balance"
          style="color:var(--ui-text);font-size:1.875rem;font-weight:700;letter-spacing:-0.02em;line-height:1.2"
        >
          Contact us
        </h1>
        <p class="mt-3 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
          We're a small team building Andacity in public beta. Send us a note — we read every
          message.
        </p>

        {/* Email CTA */}
        <div
          class="mt-6 rounded-xl px-5 py-4"
          style="background:var(--ui-surface-raised);border:1px solid var(--ui-border)"
        >
          <p class="text-sm font-medium" style="color:var(--ui-text)">Email us</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            class="mt-1 inline-block text-base font-semibold underline underline-offset-2"
            style="color:var(--ui-link)"
          >
            {CONTACT_EMAIL}
          </a>
          <p class="mt-2 text-xs" style="color:var(--ui-text-muted)">
            We aim to respond within a few business days.
          </p>
        </div>

        {/* Topic guide */}
        <div class="mt-8">
          <h2 class="text-sm font-semibold uppercase tracking-wide" style="color:var(--ui-text-muted)">
            What to include
          </h2>
          <div class="mt-3 space-y-4">
            {TOPICS.map((t) => (
              <div
                key={t.title}
                class="rounded-lg px-4 py-4"
                style="background:var(--ui-surface);border:1px solid var(--ui-border)"
              >
                <p class="text-sm font-semibold" style="color:var(--ui-text)">{t.title}</p>
                <p class="mt-1 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <p class="mt-8 text-xs" style="color:var(--ui-text-muted)">
          For privacy and legal requests, you can also reference our{' '}
          <a href="/privacy" class="underline underline-offset-2" style="color:var(--ui-link)">
            Privacy Policy
          </a>
          {' '}and{' '}
          <a href="/terms" class="underline underline-offset-2" style="color:var(--ui-link)">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Contact | Andacity Travel'
  const description =
    'Get in touch with the Andacity team — questions, feedback, booking issues, or privacy requests.'
  const canonicalHref = new URL('/contact', url.origin).href

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
