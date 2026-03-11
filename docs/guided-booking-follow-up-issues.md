# Guided Booking Follow-up Issues

Issues surfaced by the first live run of the guided booking QA harness against the local app and reseeded database.

## 1. Trip edit apply latency is too high for decision-critical flows

Severity:
- High

Evidence:
- The bundle-override apply call took about `4.7s` during the baseline run.
- The slow path was the hotel replacement apply request on the prepared bundle trip.
- This was measured directly by the new guided QA harness, not inferred from static code.

Why it matters:
- Replacement and override flows are supposed to build trust.
- Multi-second apply latency makes users doubt whether the change stuck, especially after reading a recommendation or preview explanation.

Follow-on:
- Profile the trip edit apply path end to end and move expensive recomputation off the blocking request where possible.

## 2. Trip read-after-write refresh is still slower than the browse surfaces

Severity:
- Medium

Evidence:
- Prepared trip detail fetches averaged just over `1s` during the baseline run.
- Browse surfaces in the same run mostly stayed below that threshold, while trip reads repeatedly crossed it after edits.

Why it matters:
- Stabilization work is concentrated on trip intelligence, replacement, and bundle guidance.
- If the trip surface is materially slower than Hotels, Cars, and Flights, QA friction remains high even when the flow is functionally correct.

Follow-on:
- Profile `GET /api/trips/:id` and the server-side trip-detail assembly path after mutations.
- Trim repeated revalidation, bundling, and pricing work that can be cached or deferred.

## 3. Budget and last-minute trust still depends on coarse policy blurbs

Severity:
- Medium

Evidence:
- The budget and last-minute scenarios still rely on broad fee, deposit, and cancellation copy instead of exact payable totals or deadlines.
- The missing backend inputs are documented in [trust-panel-followups.md](/home/alden/a/andacity/docs/trust-panel-followups.md).

Why it matters:
- A low price is not trustworthy if the mandatory fees and timing constraints remain vague.
- This undermines the two scenarios where the suite is most sensitive to trust regressions: budget-constrained and last-minute booking.

Follow-on:
- Prioritize exact fee, deposit, mileage, refund, and cancellation-deadline fields for hotel, car, and flight detail surfaces.
