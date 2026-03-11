# Guided Booking QA Suite

Repeatable post-reseed QA for practical booking flows across Hotels, Cars, Flights, Trips, and Bundles.

## Run It

Start the local app, then run:

```sh
pnpm qa:guided-booking -- --env-file .env.local
```

Useful flags:

- `--base-url http://127.0.0.1:5174`
- `--write-report docs/guided-booking-qa-baseline.md`
- `--write-json /tmp/guided-booking-qa.json`
- `--json`
- `--skip-http`

Notes:

- The harness reads `DATABASE_URL` and `PUBLIC_BASE_URL` from the chosen env file.
- If the configured localhost port is stale, the harness probes common Vite ports and uses the first reachable app.
- Prepared trips are reused by name with a `[QA]` prefix so the suite can be rerun without manual cleanup.

## What It Produces

The generated report includes six written QA scripts:

- weekend leisure trip
- business flight + hotel
- budget-constrained trip
- last-minute booking
- multi-item itinerary with replacements
- smart bundle suggestion with manual override

Each script includes:

- live fixture details from the current reseeded data
- runnable URLs against the current app instance
- flow steps
- expected outcomes
- prompts for trust failures
- prompts for ranking weirdness
- prompts for broken states
- prompts for friction points
- automated performance and API observations

## Coverage

The suite is intentionally scenario-driven instead of exhaustive:

- Hotels: weekend, business, budget, last-minute, bundle override
- Cars: weekend, multi-item replacement
- Flights: business, budget, last-minute, multi-item replacement, bundle override
- Trips: weekend, business, multi-item replacement, bundle override
- Bundles: bundle suggestion with manual override

## Workflow

1. Rerun the harness after each reseed or stabilization change.
2. Use the generated URLs and prepared trip ids instead of ad hoc searches.
3. Record manual observations directly under each scenario.
4. Promote anything critical into a follow-on implementation issue.

The current follow-on issue set is tracked in [guided-booking-follow-up-issues.md](/home/alden/a/andacity/docs/guided-booking-follow-up-issues.md).
