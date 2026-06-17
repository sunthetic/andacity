/**
 * CLAUDE-UI-001 — Palette + Visual Direction preview.
 *
 * DEV / DESIGN-PREVIEW ONLY. This is not a production surface and is not wired
 * into the production token system. Each palette renders a fully self-contained
 * mini-mock using locally-scoped CSS custom properties (`--p-*`) set on a wrapper,
 * so the six directions render independently of the live runtime theme.
 *
 * Rendered by the noindex, prod-gated route at /dev/ui-palettes.
 */
import { Slot, component$ } from "@builder.io/qwik";

/* ------------------------------------------------------------------ */
/* Palette model                                                       */
/* ------------------------------------------------------------------ */

export type Palette = {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  bestFor: string;
  logoCompat: "Very high" | "High" | "Medium" | "Low-medium" | "Medium-low" | "Low";
  scheme: "Light" | "Dark";
  /* surfaces + text */
  bg: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkMuted: string;
  border: string;
  /* action + accent */
  primary: string;
  primaryHover: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  price: string;
  /* photographic stand-ins (gradients used in place of real photography) */
  heroGrad: string;
  heroScrim: string;
  cardPhoto: string;
  /* form */
  radius: string;
  /* type (rendered with available faces; production names noted) */
  headingCss: string;
  bodyCss: string;
  headingName: string;
  bodyName: string;
  /* notes */
  photo: string;
};

const SERIF = "Georgia, 'Times New Roman', serif";
const LEXEND = "'Lexend Variable', 'Lexend', sans-serif";
const POPPINS = "'Poppins', system-ui, sans-serif";

export const PALETTES: Palette[] = [
  {
    id: "skyglass-luxe",
    name: "Skyglass Luxe",
    tagline: "Google Flights, but beautiful.",
    mood: "Cool · precise · premium-aviation trust",
    bestFor: "Flights / city / premium planning",
    logoCompat: "Low",
    scheme: "Light",
    bg: "#F6F8FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF2F8",
    ink: "#0E1B2E",
    inkMuted: "#5A6B82",
    border: "rgba(15,23,42,0.10)",
    primary: "#1E6AE1",
    primaryHover: "#1854C0",
    onPrimary: "#FFFFFF",
    accent: "#38BDF8",
    accentSoft: "#E3F3FE",
    price: "#1854C0",
    heroGrad: "linear-gradient(135deg,#1E6AE1 0%,#3FA9F5 55%,#9AD7FF 100%)",
    heroScrim: "linear-gradient(180deg,rgba(8,15,30,0.12) 0%,rgba(8,15,30,0.52) 100%)",
    cardPhoto: "linear-gradient(160deg,#cfe3ff,#9ec5f0)",
    radius: "12px",
    headingCss: LEXEND,
    bodyCss: POPPINS,
    headingName: "Lexend",
    bodyName: "Inter / Söhne grotesque",
    photo: "Bright, airy, high-key — window-seat skies, glass architecture",
  },
  {
    id: "sunset-atlas",
    name: "Sunset Atlas",
    tagline: "Desire, escape, golden hour.",
    mood: "Warm · aspirational · emotionally captivating",
    bestFor: "Beach / couples / discovery",
    logoCompat: "Medium-low",
    scheme: "Light",
    bg: "#FBF6F1",
    surface: "#FFFFFF",
    surfaceMuted: "#F4ECE5",
    ink: "#1B1726",
    inkMuted: "#6E6678",
    border: "rgba(27,23,38,0.12)",
    primary: "#FB5E3D",
    primaryHover: "#E0481F",
    onPrimary: "#FFFFFF",
    accent: "#7C3AED",
    accentSoft: "#EFE7FE",
    price: "#E0481F",
    heroGrad: "linear-gradient(130deg,#2A1B45 0%,#7C3AED 32%,#FB5E3D 72%,#F59E0B 100%)",
    heroScrim: "linear-gradient(180deg,rgba(20,12,30,0.10) 0%,rgba(20,12,30,0.50) 100%)",
    cardPhoto: "linear-gradient(160deg,#FFD8A8,#FB7185)",
    radius: "14px",
    headingCss: SERIF,
    bodyCss: POPPINS,
    headingName: "Fraunces / Canela (serif display)",
    bodyName: "Inter grotesque",
    photo: "Golden-hour, saturated, people-in-place — beaches & skylines at dusk",
  },
  {
    id: "alpine-signal",
    name: "Alpine Signal",
    tagline: "Clean mountain air, dependable.",
    mood: "Grounded · outdoors · trustworthy",
    bestFor: "Cars / road-trip / adventure",
    logoCompat: "Medium",
    scheme: "Light",
    bg: "#F4F3EF",
    surface: "#FFFFFF",
    surfaceMuted: "#ECEAE3",
    ink: "#15201C",
    inkMuted: "#5C6660",
    border: "rgba(21,32,28,0.12)",
    primary: "#157A5B",
    primaryHover: "#0C4A39",
    onPrimary: "#FFFFFF",
    accent: "#7FB7D9",
    accentSoft: "#E4F1F7",
    price: "#0C4A39",
    heroGrad: "linear-gradient(150deg,#0C4A39 0%,#157A5B 45%,#7FB7D9 100%)",
    heroScrim: "linear-gradient(180deg,rgba(10,20,16,0.12) 0%,rgba(10,20,16,0.52) 100%)",
    cardPhoto: "linear-gradient(160deg,#cfe6df,#9fc7d8)",
    radius: "12px",
    headingCss: LEXEND,
    bodyCss: POPPINS,
    headingName: "Lexend",
    bodyName: "Inter grotesque",
    photo: "Cool daylight, un-saturated — mountains, fjords, trails",
  },
  {
    id: "midnight-terminal",
    name: "Midnight Terminal",
    tagline: "First-class lounge at 11pm.",
    mood: "Cinematic · electric · premium night-travel",
    bestFor: "City / nightlife / marketing wow",
    logoCompat: "Low-medium",
    scheme: "Dark",
    bg: "#0B0E1A",
    surface: "#161C2E",
    surfaceMuted: "#1E2640",
    ink: "#E7ECF5",
    inkMuted: "#9AA6BD",
    border: "rgba(231,236,245,0.12)",
    primary: "#4F86FF",
    primaryHover: "#6AA0FF",
    onPrimary: "#08122B",
    accent: "#8B5CF6",
    accentSoft: "rgba(139,92,246,0.18)",
    price: "#34D399",
    heroGrad: "linear-gradient(135deg,#0B0E1A 0%,#1B2550 42%,#3B82F6 78%,#8B5CF6 100%)",
    heroScrim: "linear-gradient(180deg,rgba(4,6,12,0.10) 0%,rgba(4,6,12,0.55) 100%)",
    cardPhoto: "linear-gradient(160deg,#243056,#3B82F6)",
    radius: "12px",
    headingCss: LEXEND,
    bodyCss: POPPINS,
    headingName: "Space Grotesk / Lexend",
    bodyName: "Inter grotesque",
    photo: "Moody, contrasty — night cities, runways at dusk, neon",
  },
  {
    id: "sandbar-editorial",
    name: "Sandbar Editorial",
    tagline: "A premium travel magazine you trust.",
    mood: "Quiet luxury · editorial calm",
    bestFor: "Hotels / discovery / guides",
    logoCompat: "High",
    scheme: "Light",
    bg: "#FAF7F1",
    surface: "#FFFFFF",
    surfaceMuted: "#F1E9DC",
    ink: "#14110D",
    inkMuted: "#6B6256",
    border: "rgba(20,17,13,0.12)",
    primary: "#0E7C73",
    primaryHover: "#0B5F58",
    onPrimary: "#FFFFFF",
    accent: "#C4683C",
    accentSoft: "#F3E2D6",
    price: "#14110D",
    heroGrad: "linear-gradient(150deg,#0E7C73 0%,#3A9A90 52%,#E9DCC6 100%)",
    heroScrim: "linear-gradient(180deg,rgba(20,17,13,0.10) 0%,rgba(20,17,13,0.48) 100%)",
    cardPhoto: "linear-gradient(160deg,#e9dcc6,#cbb89a)",
    radius: "10px",
    headingCss: SERIF,
    bodyCss: POPPINS,
    headingName: "Spectral / Fraunces (serif display)",
    bodyName: "Inter grotesque",
    photo: "Full-bleed editorial, warm muted grade — real places & textures",
  },
  {
    id: "andacity-meridian",
    name: "Andacity Meridian",
    tagline: "Built from the brand. Approachable premium.",
    mood: "Warm · confident · trustworthy",
    bestFor: "All-round whole-trip generalist",
    logoCompat: "Very high",
    scheme: "Light",
    bg: "#FBF8F2",
    surface: "#FFFFFF",
    surfaceMuted: "#F3ECDD",
    ink: "#0F2433",
    inkMuted: "#5C6B6A",
    border: "rgba(15,36,51,0.12)",
    primary: "#0F766E",
    primaryHover: "#0C5F58",
    onPrimary: "#FFFFFF",
    accent: "#F2A516",
    accentSoft: "#FCEFD2",
    price: "#0F766E",
    heroGrad: "linear-gradient(140deg,#0C3B38 0%,#0F766E 40%,#14B8A6 72%,#F2A516 100%)",
    heroScrim: "linear-gradient(180deg,rgba(8,28,28,0.10) 0%,rgba(8,28,28,0.50) 100%)",
    cardPhoto: "linear-gradient(160deg,#bfe7e1,#0F766E)",
    radius: "13px",
    headingCss: LEXEND,
    bodyCss: POPPINS,
    headingName: "Lexend",
    bodyName: "General Sans / Inter grotesque",
    photo: "Warm, inviting, natural light — coastal + city + people",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const frameVars = (p: Palette) =>
  [
    `--p-bg:${p.bg}`,
    `--p-surface:${p.surface}`,
    `--p-surface-muted:${p.surfaceMuted}`,
    `--p-ink:${p.ink}`,
    `--p-ink-muted:${p.inkMuted}`,
    `--p-border:${p.border}`,
    `--p-primary:${p.primary}`,
    `--p-primary-hover:${p.primaryHover}`,
    `--p-on-primary:${p.onPrimary}`,
    `--p-accent:${p.accent}`,
    `--p-accent-soft:${p.accentSoft}`,
    `--p-price:${p.price}`,
    `--p-radius:${p.radius}`,
    `--p-heading:${p.headingCss}`,
    `--p-body:${p.bodyCss}`,
    `--p-hero:${p.heroGrad}`,
    `--p-hero-scrim:${p.heroScrim}`,
    `--p-card-photo:${p.cardPhoto}`,
  ].join(";");

const CarGlyph = () => (
  <svg viewBox="0 0 48 24" width="56" height="28" aria-hidden="true" style="opacity:0.85">
    <path
      d="M4 16l2-6a4 4 0 0 1 3.7-2.6h11.2a4 4 0 0 1 3.3 1.8L31 14l9 1.6a3 3 0 0 1 2.5 3V20h-4M4 16v4h4M4 16h28M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm22 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      fill="none"
      stroke="var(--p-ink-muted)"
      stroke-width="1.6"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Sub-surfaces (each reads scoped --p-* vars)                         */
/* ------------------------------------------------------------------ */

const Pill = component$((props: { label: string; tone?: "primary" | "ghost" }) => (
  <span
    class="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
    style={
      props.tone === "primary"
        ? "background:var(--p-primary);color:var(--p-on-primary)"
        : "border:1px solid var(--p-border);color:var(--p-ink)"
    }
  >
    {props.label}
  </span>
));

const HeaderBar = component$(() => (
  <div
    class="flex items-center justify-between px-5 py-3.5"
    style="background:var(--p-surface);border-bottom:1px solid var(--p-border)"
  >
    <div class="flex items-center gap-6">
      <span
        class="text-lg font-extrabold tracking-tight"
        style="font-family:var(--p-heading);color:var(--p-ink)"
      >
        Anda<span style="color:var(--p-primary)">city</span>
      </span>
      <nav class="hidden gap-4 text-[13px] md:flex" style="color:var(--p-ink-muted)">
        <span>Flights</span>
        <span>Hotels</span>
        <span>Cars</span>
        <span>Explore</span>
      </nav>
    </div>
    <div class="flex items-center gap-2">
      <Pill label="Trips" />
      <Pill label="Search" tone="primary" />
    </div>
  </div>
));

const SearchPanel = component$(() => (
  <div
    class="mt-6 flex flex-col gap-3 p-3 md:flex-row md:items-end"
    style="background:var(--p-surface);border:1px solid var(--p-border);border-radius:var(--p-radius);box-shadow:0 24px 50px rgba(0,0,0,0.22)"
  >
    {[
      { l: "Where to", v: "Lisbon, Portugal" },
      { l: "Dates", v: "Jun 14 – 20" },
      { l: "Travelers", v: "2 adults" },
    ].map((f) => (
      <div key={f.l} class="flex-1 rounded-lg px-3 py-1.5" style="background:var(--p-surface-muted)">
        <div class="text-[10px] font-semibold uppercase tracking-[0.1em]" style="color:var(--p-ink-muted)">
          {f.l}
        </div>
        <div class="mt-0.5 text-sm font-semibold" style="color:var(--p-ink)">
          {f.v}
        </div>
      </div>
    ))}
    <button
      type="button"
      class="rounded-lg px-5 py-2.5 text-sm font-semibold"
      style="background:var(--p-primary);color:var(--p-on-primary);border-radius:var(--p-radius)"
    >
      Search
    </button>
  </div>
));

const PriceBlock = component$((props: { label: string; value: string }) => (
  <div>
    <div class="text-[10px] font-medium" style="color:var(--p-ink-muted)">
      {props.label}
    </div>
    <div class="text-lg font-extrabold leading-none" style="color:var(--p-price)">
      {props.value}
    </div>
  </div>
));

const CardShell = component$(() => (
  <div
    class="overflow-hidden"
    style="background:var(--p-surface);border:1px solid var(--p-border);border-radius:var(--p-radius)"
  >
    <Slot />
  </div>
));

const HotelCard = component$(() => (
  <CardShell>
    <div class="h-28" style="background-image:var(--p-card-photo)" />
    <div class="p-3.5">
      <div class="text-[12px] tracking-wide" style="color:var(--p-accent)">
        ★★★★★
      </div>
      <div class="mt-1 text-sm font-bold" style="font-family:var(--p-heading);color:var(--p-ink)">
        Tivoli Avenida
      </div>
      <div class="text-[12px]" style="color:var(--p-ink-muted)">
        Avenida · 9.2 Superb (1,204)
      </div>
      <div class="mt-3 flex items-end justify-between">
        <PriceBlock label="Total · 3 nights" value="$612" />
        <Pill label="View" tone="primary" />
      </div>
    </div>
  </CardShell>
));

const FlightCard = component$(() => (
  <CardShell>
    <div class="p-3.5">
      <div class="flex items-center justify-between text-[11px]" style="color:var(--p-ink-muted)">
        <span>Nonstop · 6h 40m</span>
        <span>TAP Air</span>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <div class="text-center">
          <div class="text-sm font-bold" style="color:var(--p-ink)">
            07:20
          </div>
          <div class="text-[11px]" style="color:var(--p-ink-muted)">
            JFK
          </div>
        </div>
        <div class="relative flex-1">
          <div class="h-px w-full" style="background:var(--p-border)" />
          <span
            class="absolute -top-1 left-0 size-2 rounded-full"
            style="background:var(--p-primary)"
          />
          <span
            class="absolute -top-1 right-0 size-2 rounded-full"
            style="background:var(--p-accent)"
          />
          <span
            class="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[10px]"
            style="color:var(--p-primary)"
          >
            ✈
          </span>
        </div>
        <div class="text-center">
          <div class="text-sm font-bold" style="color:var(--p-ink)">
            19:00
          </div>
          <div class="text-[11px]" style="color:var(--p-ink-muted)">
            LIS
          </div>
        </div>
      </div>
      <div class="mt-3 flex items-end justify-between">
        <PriceBlock label="Round trip" value="$486" />
        <Pill label="Select" tone="primary" />
      </div>
    </div>
  </CardShell>
));

const CarCard = component$(() => (
  <CardShell>
    <div class="grid h-28 place-items-center" style="background:var(--p-surface-muted)">
      <CarGlyph />
    </div>
    <div class="p-3.5">
      <div class="text-sm font-bold" style="font-family:var(--p-heading);color:var(--p-ink)">
        Intermediate SUV
      </div>
      <div class="text-[12px]" style="color:var(--p-ink-muted)">
        Auto · 5 seats · LIS Airport
      </div>
      <div class="mt-3 flex items-end justify-between">
        <PriceBlock label="Per day" value="$41" />
        <Pill label="Reserve" tone="primary" />
      </div>
    </div>
  </CardShell>
));

const DestinationCard = component$(() => (
  <div
    class="relative overflow-hidden"
    style="border-radius:var(--p-radius);min-height:9.5rem;background-image:var(--p-card-photo)"
  >
    <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.6) 100%)" />
    <span
      class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
      style="background:var(--p-accent);color:#1a1205"
    >
      Trending
    </span>
    <div class="absolute inset-x-0 bottom-0 p-3.5">
      <div class="text-base font-bold text-white" style="font-family:var(--p-heading)">
        Lisbon
      </div>
      <div class="text-[12px] text-white/85">From $480 · 6h flights</div>
    </div>
  </div>
));

const ResultSurface = component$(() => (
  <div class="grid gap-3 md:grid-cols-[160px_1fr]">
    <aside
      class="hidden p-3 md:block"
      style="background:var(--p-surface);border:1px solid var(--p-border);border-radius:var(--p-radius)"
    >
      <div class="text-[11px] font-bold uppercase tracking-wide" style="color:var(--p-ink)">
        Filters
      </div>
      <div class="mt-2 text-[11px] font-semibold" style="color:var(--p-ink-muted)">
        Price
      </div>
      <div class="mt-1 h-1.5 w-full rounded-full" style="background:var(--p-surface-muted)">
        <div class="h-1.5 w-2/3 rounded-full" style="background:var(--p-primary)" />
      </div>
      <div class="mt-3 flex flex-col gap-1.5">
        {["Free cancellation", "4+ stars", "Breakfast"].map((f, i) => (
          <label key={f} class="flex items-center gap-2 text-[11px]" style="color:var(--p-ink-muted)">
            <span
              class="grid size-3.5 place-items-center rounded-[4px]"
              style={
                i === 0
                  ? "background:var(--p-primary);color:var(--p-on-primary)"
                  : "border:1px solid var(--p-border)"
              }
            >
              {i === 0 ? <span class="text-[9px]">✓</span> : null}
            </span>
            {f}
          </label>
        ))}
      </div>
    </aside>

    <div>
      <div class="flex items-center justify-between">
        <div class="flex gap-1.5">
          {["Free cancellation ✕", "4+ stars ✕"].map((c) => (
            <span
              key={c}
              class="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style="background:var(--p-accent-soft);color:var(--p-ink)"
            >
              {c}
            </span>
          ))}
        </div>
        <span class="text-[11px] font-semibold" style="color:var(--p-ink-muted)">
          Sort: Best ▾
        </span>
      </div>

      <div class="mt-2 flex flex-col gap-2">
        {[
          { n: "Memmo Alfama", m: "Alfama · 9.4", p: "$214" },
          { n: "Hotel Avenida Palace", m: "Baixa · 9.1", p: "$268" },
        ].map((r) => (
          <div
            key={r.n}
            class="flex items-center gap-3 p-2.5"
            style="background:var(--p-surface);border:1px solid var(--p-border);border-radius:var(--p-radius)"
          >
            <div class="h-14 w-20 shrink-0 rounded-md" style="background-image:var(--p-card-photo)" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold" style="color:var(--p-ink)">
                {r.n}
              </div>
              <div class="text-[12px]" style="color:var(--p-ink-muted)">
                {r.m} · Free cancellation
              </div>
            </div>
            <div class="text-right">
              <div class="text-base font-extrabold leading-none" style="color:var(--p-price)">
                {r.p}
              </div>
              <div class="text-[10px]" style="color:var(--p-ink-muted)">
                / night
              </div>
            </div>
            <Pill label="View" tone="primary" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

const CtaBand = component$(() => (
  <div class="relative overflow-hidden px-6 py-8 text-center" style="background-image:var(--p-hero)">
    <div class="absolute inset-0" style="background-image:var(--p-hero-scrim)" />
    <div class="relative">
      <h3 class="text-xl font-bold text-white md:text-2xl" style="font-family:var(--p-heading)">
        One trip, fully planned.
      </h3>
      <p class="mx-auto mt-1 max-w-[40ch] text-sm text-white/85">
        Save flights, stays, and cars to a single itinerary.
      </p>
      <button
        type="button"
        class="mt-4 rounded-lg px-5 py-2.5 text-sm font-bold"
        style="background:var(--p-surface);color:var(--p-primary);border-radius:var(--p-radius)"
      >
        Start a trip →
      </button>
    </div>
  </div>
));

const FooterBar = component$(() => (
  <div class="px-6 py-6" style="background:var(--p-surface);border-top:1px solid var(--p-border)">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <span class="text-base font-extrabold" style="font-family:var(--p-heading);color:var(--p-ink)">
          Anda<span style="color:var(--p-primary)">city</span>
        </span>
        <p class="mt-1 max-w-[28ch] text-[12px]" style="color:var(--p-ink-muted)">
          Find better trips. Book with confidence.
        </p>
      </div>
      <div class="flex gap-10 text-[12px]" style="color:var(--p-ink-muted)">
        {[
          ["Product", ["Flights", "Hotels", "Cars"]],
          ["Explore", ["Destinations", "City guides"]],
        ].map(([title, items]) => (
          <div key={title as string}>
            <div class="font-bold" style="color:var(--p-ink)">
              {title as string}
            </div>
            <ul class="mt-1.5 space-y-1">
              {(items as string[]).map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
));

const MobileFrame = component$((props: { p: Palette }) => (
  <div class="mx-auto w-[286px] rounded-[30px] p-2.5 shadow-2xl" style="background:var(--p-ink)">
    <div class="overflow-hidden rounded-[22px]" style="background:var(--p-bg)">
      <div
        class="flex items-center justify-between px-4 py-2.5"
        style="background:var(--p-surface);border-bottom:1px solid var(--p-border)"
      >
        <span class="text-sm font-extrabold" style="font-family:var(--p-heading);color:var(--p-ink)">
          Anda<span style="color:var(--p-primary)">city</span>
        </span>
        <span class="text-[16px]" style="color:var(--p-ink-muted)">
          ☰
        </span>
      </div>
      <div class="relative overflow-hidden" style="background-image:var(--p-hero)">
        <div class="absolute inset-0" style="background-image:var(--p-hero-scrim)" />
        <div class="relative px-4 py-6">
          <h4 class="max-w-[14ch] text-xl font-bold leading-tight text-white" style="font-family:var(--p-heading)">
            Where to next?
          </h4>
          <div
            class="mt-3 flex items-center justify-between p-2"
            style="background:var(--p-surface);border-radius:var(--p-radius);box-shadow:0 12px 26px rgba(0,0,0,0.25)"
          >
            <span class="px-2 text-[12px] font-semibold" style="color:var(--p-ink-muted)">
              Search destinations
            </span>
            <span
              class="grid size-7 place-items-center rounded-full text-[13px]"
              style="background:var(--p-primary);color:var(--p-on-primary)"
            >
              →
            </span>
          </div>
        </div>
      </div>
      <div class="p-3">
        <div class="overflow-hidden" style="background:var(--p-surface);border:1px solid var(--p-border);border-radius:var(--p-radius)">
          <div class="h-24" style="background-image:var(--p-card-photo)" />
          <div class="p-3">
            <div class="text-sm font-bold" style="font-family:var(--p-heading);color:var(--p-ink)">
              Memmo Alfama
            </div>
            <div class="text-[11px]" style="color:var(--p-ink-muted)">
              Alfama · 9.4 Superb
            </div>
            <div class="mt-2 flex items-end justify-between">
              <span class="text-base font-extrabold" style="color:var(--p-price)">
                $214
              </span>
              <span
                class="rounded-full px-3 py-1 text-[11px] font-bold"
                style="background:var(--p-primary);color:var(--p-on-primary)"
              >
                View
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

const SwatchRow = component$((props: { p: Palette }) => {
  const swatches: { label: string; value: string }[] = [
    { label: "Primary", value: props.p.primary },
    { label: "Accent", value: props.p.accent },
    { label: "Price", value: props.p.price },
    { label: "Ink", value: props.p.ink },
    { label: "Surface", value: props.p.surface },
    { label: "Background", value: props.p.bg },
  ];
  return (
    <div class="mt-4 flex flex-wrap gap-2">
      {swatches.map((s) => (
        <div
          key={s.label}
          class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700"
        >
          <span class="size-4 rounded-full ring-1 ring-black/10" style={`background:${s.value}`} />
          <span class="font-semibold">{s.label}</span>
          <span class="font-mono text-neutral-400">{s.value}</span>
        </div>
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Showcase (one palette)                                              */
/* ------------------------------------------------------------------ */

export const Showcase = component$((props: { p: Palette }) => {
  const p = props.p;
  return (
    <section id={p.id} class="scroll-mt-24">
      {/* Meta header (neutral chrome, not palette-themed) */}
      <div class="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-neutral-900">{p.name}</h2>
          <p class="mt-0.5 text-sm text-neutral-600">
            <span class="italic">“{p.tagline}”</span> · {p.mood}
          </p>
          <p class="mt-1 text-[12px] text-neutral-500">
            Best for: {p.bestFor} · Scheme: {p.scheme} · Display: {p.headingName} · Body: {p.bodyName}
          </p>
        </div>
        <span
          class={[
            "rounded-full px-3 py-1 text-[12px] font-bold",
            p.logoCompat === "Very high" || p.logoCompat === "High"
              ? "bg-emerald-100 text-emerald-800"
              : p.logoCompat === "Medium"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-700",
          ]}
        >
          Logo compatibility: {p.logoCompat}
        </span>
      </div>

      <div class="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Desktop composition */}
        <div
          style={frameVars(p)}
          class="overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        >
          <HeaderBar />
          {/* Hero with palette-specific photo note injected */}
          <div class="relative overflow-hidden" style="background-image:var(--p-hero)">
            <div class="absolute inset-0" style="background-image:var(--p-hero-scrim)" />
            <div class="relative px-6 py-10 md:px-8 md:py-14">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em]" style="color:rgba(255,255,255,0.82)">
                Plan the whole trip
              </p>
              <h2
                class="mt-2 max-w-[18ch] text-3xl font-bold leading-[1.08] md:text-[2.6rem]"
                style="font-family:var(--p-heading);color:#fff"
              >
                Calm confidence for the whole trip
              </h2>
              <p class="mt-3 max-w-[46ch] text-sm" style="color:rgba(255,255,255,0.88)">
                Flights, stays, and cars in one place — with the clarity of a
                great booking tool and the feel of a great trip.
              </p>
              <SearchPanel />
              <p class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.72)">
                Photography direction: {p.photo}
              </p>
            </div>
          </div>

          <div class="p-5" style="background:var(--p-bg)">
            <div class="mb-2 text-[11px] font-bold uppercase tracking-wide" style="color:var(--p-ink-muted)">
              Cards
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HotelCard />
              <FlightCard />
              <CarCard />
              <DestinationCard />
            </div>

            <div class="mb-2 mt-6 text-[11px] font-bold uppercase tracking-wide" style="color:var(--p-ink-muted)">
              Results + filters
            </div>
            <ResultSurface />
          </div>

          <CtaBand />
          <FooterBar />
        </div>

        {/* Mobile frame column */}
        <div style={frameVars(p)} class="lg:pt-2">
          <div class="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-neutral-500">
            Mobile
          </div>
          <MobileFrame p={p} />
        </div>
      </div>

      <SwatchRow p={p} />
    </section>
  );
});

/* ------------------------------------------------------------------ */
/* Full preview page body                                              */
/* ------------------------------------------------------------------ */

export const PalettePreview = component$(() => (
  <div class="min-h-screen bg-neutral-100 text-neutral-900">
    {/* Non-production banner */}
    <div class="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Design-direction preview — CLAUDE-UI-001. Not a production page. Not wired
      to production tokens. <span class="font-normal">noindex · blocked on the production host.</span>
    </div>

    <header class="mx-auto max-w-5xl px-4 pt-8">
      <h1 class="text-3xl font-extrabold tracking-tight">Andacity — Palette &amp; Visual Direction Samples</h1>
      <p class="mt-2 max-w-[70ch] text-sm text-neutral-600">
        Six self-contained directions, each rendered with its own locally-scoped
        palette (independent of the live runtime theme). Every mock shows the
        header, photographic hero, search panel, hotel/flight/car/destination
        cards, a results+filters surface, a CTA band, a footer, and a mobile
        frame. Photography is represented by gradient stand-ins; production uses
        real imagery. See{" "}
        <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[12px]">docs/ui-redesign/PALETTE_OPTIONS.md</code>{" "}
        for full specs and the recommendation.
      </p>

      {/* Jump nav */}
      <nav class="mt-5 flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            class="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-neutral-700 hover:border-neutral-400"
          >
            {p.name}
          </a>
        ))}
      </nav>
    </header>

    <main class="mx-auto max-w-5xl space-y-16 px-4 py-12">
      {PALETTES.map((p) => (
        <Showcase key={p.id} p={p} />
      ))}
    </main>

    <footer class="mx-auto max-w-5xl px-4 pb-16 text-[12px] text-neutral-500">
      CLAUDE-UI-001 · palette preview · no production page rewritten · next:
      CLAUDE-UI-002 (UI System Foundation) after a direction is approved.
    </footer>
  </div>
));
