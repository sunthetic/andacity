/**
 * CLAUDE-UI-009 — Hotel detail page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-hotel-detail). A premium,
 * media-first, calm hotel detail concept built entirely on the `--ui-*`
 * foundation + CLAUDE-UI-002 primitives. Renders inside the production global
 * shell (SiteHeader/SiteFooter via the root layout); this component is only the
 * page body. It does NOT replace src/routes/hotels/[slug]/index.tsx.
 *
 * All hotel content is ILLUSTRATIVE (see hotelDetailSampleData.ts) — fictional
 * property, sample rooms/rates/prices, sample rating. Imagery is `--ui-hero`
 * gradient placeholders (no remote dependency). See
 * docs/ui-redesign/samples/HOTEL_DETAIL_SAMPLE.md for what is illustrative vs.
 * real and the real-photo plan.
 */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { HotelCard } from "~/components/ui/HotelCard";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { BookingRail } from "~/components/dev/hotel-detail/BookingRail";
import { HotelGallery } from "~/components/dev/hotel-detail/HotelGallery";
import { RoomRateCard } from "~/components/dev/hotel-detail/RoomRateCard";
import {
  SAMPLE_HOTEL,
  SAMPLE_RELATED_STAYS,
} from "~/components/dev/hotel-detail/hotelDetailSampleData";
import { formatMoney } from "~/lib/pricing/price-display";

const h = SAMPLE_HOTEL;

/* ------------------------------------------------------------------ */
/* Breadcrumb + title header                                          */
/* ------------------------------------------------------------------ */

const Breadcrumb = component$(() => (
  <nav aria-label="Breadcrumb" class="mx-auto max-w-6xl px-4 pt-5">
    <ol
      class="flex flex-wrap items-center gap-2 text-[12px]"
      style="color:var(--ui-text-muted)"
    >
      {[
        { label: "Home", href: "/" },
        { label: "Hotels", href: "/hotels" },
        { label: h.city, href: "/hotels/in/miami" },
      ].map((c) => (
        <li key={c.label} class="flex items-center gap-2">
          <a
            href={c.href}
            class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          >
            {c.label}
          </a>
          <span aria-hidden="true">/</span>
        </li>
      ))}
      <li aria-current="page" style="color:var(--ui-text)">
        {h.name}
      </li>
    </ol>
  </nav>
));

const TitleHeader = component$(() => (
  <header class="mx-auto max-w-6xl px-4 pt-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="text-[13px]"
            style="color:var(--ui-accent)"
            aria-label={`${h.stars} star`}
          >
            {"★".repeat(h.stars)}
          </span>
          <Badge tone="neutral" label={`${h.neighborhood}, ${h.city}`} />
        </div>
        <h1
          class="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl"
          style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
        >
          {h.name}
        </h1>
        <div
          class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          style="color:var(--ui-text-muted)"
        >
          <span class="inline-flex items-center gap-1.5">
            <span
              class="grid place-items-center rounded-lg px-2 py-0.5 text-[12px] font-extrabold"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
            >
              {h.rating.toFixed(1)}
            </span>
            <span class="font-semibold" style="color:var(--ui-text)">
              {h.reviewLabel}
            </span>
          </span>
          <span>· {h.reviewCount.toLocaleString("en-US")} reviews</span>
          <span aria-hidden="true">·</span>
          <span>{h.address}</span>
        </div>
      </div>

      <div class="flex shrink-0 gap-2">
        <Button
          variant="ghost"
          size="sm"
          label="♡ Save"
          ariaLabel="Save this hotel"
        />
        <Button
          variant="ghost"
          size="sm"
          label="↗ Share"
          ariaLabel="Share this hotel"
        />
      </div>
    </div>

    {/* Quiet highlight row */}
    <ul class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {h.highlights.map((hl) => (
        <li
          key={hl}
          class="flex items-center gap-1.5 text-[12px]"
          style="color:var(--ui-text-secondary)"
        >
          <span aria-hidden="true" style="color:var(--ui-success)">
            ✓
          </span>
          {hl}
        </li>
      ))}
    </ul>
  </header>
));

/* ------------------------------------------------------------------ */
/* Overview                                                           */
/* ------------------------------------------------------------------ */

const Overview = component$(() => (
  <section>
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Overview
    </h2>
    <p
      class="mt-2 max-w-[68ch] text-sm md:text-base"
      style="color:var(--ui-text-muted)"
    >
      {h.summary}
    </p>
  </section>
));

/* ------------------------------------------------------------------ */
/* Rooms                                                              */
/* ------------------------------------------------------------------ */

const Rooms = component$(() => (
  <section id="rooms">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h2
        class="text-xl font-bold"
        style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
      >
        Choose your room
      </h2>
      <span class="text-[12px]" style="color:var(--ui-text-muted)">
        Sample rates · taxes &amp; fees included
      </span>
    </div>
    <div class="mt-4 flex flex-col gap-3">
      {h.rooms.map((room) => (
        <RoomRateCard key={room.id} room={room} currency={h.currency} />
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Amenities                                                          */
/* ------------------------------------------------------------------ */

const Amenities = component$(() => (
  <section id="amenities">
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Amenities
    </h2>
    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      {h.amenityGroups.map((group) => (
        <div
          key={group.title}
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div class="flex items-center gap-2">
            <span
              class="grid size-7 place-items-center rounded-full text-[13px]"
              style="background:var(--ui-accent-soft);color:var(--ui-accent)"
              aria-hidden="true"
            >
              {group.icon}
            </span>
            <h3 class="text-[14px] font-bold" style="color:var(--ui-text)">
              {group.title}
            </h3>
          </div>
          <ul class="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {group.items.map((item) => (
              <li
                key={item}
                class="flex items-center gap-1.5 text-[13px]"
                style="color:var(--ui-text-secondary)"
              >
                <span aria-hidden="true" style="color:var(--ui-success)">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Location + static map concept                                      */
/* ------------------------------------------------------------------ */

const LocationSection = component$(() => (
  <section id="location">
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Where you’ll be
    </h2>
    <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
      {h.address}
    </p>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Static map concept */}
      <div
        class="relative overflow-hidden"
        style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);min-height:16rem"
        role="img"
        aria-label="Map preview concept showing the hotel's approximate area — not a geocoded map"
      >
        <div
          class="absolute inset-0 opacity-60"
          aria-hidden="true"
          style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
        />
        <span
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[12px] font-bold shadow-[var(--ui-shadow-card)]"
          style="background:var(--ui-primary);color:var(--ui-on-primary)"
          aria-hidden="true"
        >
          {h.name}
        </span>
        <span
          class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
        >
          Map preview · concept
        </span>
      </div>

      {/* Nearby */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <h3 class="text-[14px] font-bold" style="color:var(--ui-text)">
          What’s nearby
        </h3>
        <ul class="mt-3 flex flex-col gap-2">
          {h.nearby.map((p) => (
            <li
              key={p.name}
              class="flex items-center justify-between gap-3 text-[13px]"
            >
              <span style="color:var(--ui-text-secondary)">{p.name}</span>
              <span
                class="shrink-0 font-medium"
                style="color:var(--ui-text-muted)"
              >
                {p.distance}
              </span>
            </li>
          ))}
        </ul>
        <p
          class="mt-3 border-t pt-3 text-[12px]"
          style="border-color:var(--ui-divider);color:var(--ui-text-muted)"
        >
          {h.gettingAround}
        </p>
        <p class="mt-2 text-[11px]" style="color:var(--ui-text-muted)">
          Distances are illustrative.
        </p>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Policies + trust                                                   */
/* ------------------------------------------------------------------ */

const Policies = component$(() => (
  <section id="policies">
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Policies &amp; what to know
    </h2>
    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      {[
        { title: "Cancellation", body: h.policies.cancellation },
        { title: "Payment", body: h.policies.payment },
        { title: "Taxes & fees", body: h.policies.fees },
        {
          title: "Check-in / out",
          body: `Check-in from ${h.policies.checkIn} · Check-out by ${h.policies.checkOut}`,
        },
      ].map((p) => (
        <div
          key={p.title}
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div class="text-sm font-bold" style="color:var(--ui-text)">
            {p.title}
          </div>
          <p class="mt-1.5 text-[13px]" style="color:var(--ui-text-muted)">
            {p.body}
          </p>
        </div>
      ))}
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <Badge tone="success" label="Total price up front" />
      <Badge tone="neutral" label="No countdown timers" />
      <Badge tone="neutral" label="No “1 room left!” pressure" />
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Related stays                                                      */
/* ------------------------------------------------------------------ */

const RelatedStays = component$(() => (
  <ResponsiveSection
    eyebrow="Keep comparing"
    title={`Other stays in ${h.city}`}
    description="A calm shortlist nearby — open any to see live options."
    container={false}
    class="mx-auto max-w-6xl px-4"
  >
    <div q:slot="action">
      <span
        class="rounded-full px-2.5 py-1 text-[10px] font-bold"
        style="background:var(--ui-accent-soft);color:var(--ui-accent)"
      >
        Sample rates · illustrative
      </span>
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_RELATED_STAYS.map((stay) => (
        <HotelCard key={stay.name} model={stay} />
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Mobile sticky CTA                                                  */
/* ------------------------------------------------------------------ */

const MobileStickyCta = component$(() => (
  <div
    class="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:0 -8px 24px rgba(8,12,22,0.12)"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
      <div class="min-w-0">
        <div class="flex items-baseline gap-1.5">
          <span
            class="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style="color:var(--ui-text-muted)"
          >
            From
          </span>
          <span class="text-lg font-extrabold" style="color:var(--ui-text)">
            {formatMoney(h.fromNightly, h.currency)}
          </span>
          <span class="text-[12px]" style="color:var(--ui-text-muted)">
            / night
          </span>
        </div>
        <div class="truncate text-[11px]" style="color:var(--ui-text-muted)">
          Taxes &amp; fees included · sample rate
        </div>
      </div>
      <a
        href="#rooms"
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary)"
      >
        Select a room
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export const HotelDetailSample = component$(() => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <Breadcrumb />
    <TitleHeader />

    {/* Gallery */}
    <div class="mx-auto mt-4 max-w-6xl px-4">
      <HotelGallery
        captions={h.galleryCaptions}
        photoCount={h.photoCount}
        hotelName={h.name}
      />
    </div>

    {/* Two-column: content + sticky booking rail */}
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div class="flex min-w-0 flex-col gap-10">
          <Overview />
          <Rooms />
          <Amenities />
          <LocationSection />
          <Policies />
        </div>

        <BookingRail hotel={h} />
      </div>
    </div>

    <RelatedStays />

    {/* spacer so the mobile sticky CTA never covers content */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
