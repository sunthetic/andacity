import type { TripItemType, TripItemValidityStatus, TripValidationIssue } from '~/types/trips/trip'

export type TripItineraryValidationItem = {
  id: number
  itemType: TripItemType
  position: number
  title: string
  startDate: string | null
  endDate: string | null
  startCityId: number | null
  endCityId: number | null
  startCityName: string | null
  endCityName: string | null
  availabilityStatus: TripItemValidityStatus
  liveFlightServiceDate: string | null
  liveFlightDepartureAt: string | null
  liveFlightArrivalAt: string | null
  liveCarLocationType: 'airport' | 'city' | null
}

export type TripItineraryValidationInput = {
  tripStartDate: string | null
  tripEndDate: string | null
  items: TripItineraryValidationItem[]
}

export type TripItineraryValidationResult = {
  issues: TripValidationIssue[]
}

const toUtcDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const addDays = (value: string | null, days: number) => {
  const date = toUtcDate(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const compareIsoDate = (a: string | null, b: string | null) => {
  if (!a || !b) return null
  if (a === b) return 0
  return a < b ? -1 : 1
}

const isHotelOrCar = (itemType: TripItemType) => itemType === 'hotel' || itemType === 'car'

const getFlightDay = (item: TripItineraryValidationItem) => item.startDate || item.liveFlightServiceDate

const getItemStartDay = (item: TripItineraryValidationItem) =>
  item.itemType === 'flight' ? getFlightDay(item) : item.startDate

const getItemEndDay = (item: TripItineraryValidationItem) =>
  item.itemType === 'flight' ? getFlightDay(item) : item.endDate

const hasInvalidDateRange = (item: TripItineraryValidationItem) => {
  if (!item.startDate || !item.endDate) return false
  if (isHotelOrCar(item.itemType)) return item.endDate <= item.startDate
  return item.endDate < item.startDate
}

const isDateInsideStay = (day: string | null, startDate: string | null, endDate: string | null) => {
  if (!day || !startDate || !endDate) return false
  return day > startDate && day < endDate
}

const rangesOverlapExclusive = (
  startA: string | null,
  endA: string | null,
  startB: string | null,
  endB: string | null,
) => {
  if (!startA || !endA || !startB || !endB) return false
  return startA < endB && startB < endA
}

const isSameOrNextDay = (baseDay: string | null, nextDay: string | null) => {
  if (!baseDay || !nextDay) return false
  return nextDay === baseDay || nextDay === addDays(baseDay, 1)
}

const isSameOrEarlierDay = (left: string | null, right: string | null) => {
  const order = compareIsoDate(left, right)
  return order != null && order <= 0
}

const formatCity = (value: string | null) => value || 'the next city'

const makeIssue = (
  code: string,
  severity: TripValidationIssue['severity'],
  message: string,
  itemId?: number,
  relatedItemIds?: number[],
): TripValidationIssue => ({
  code,
  scope: 'itinerary',
  severity,
  message,
  ...(itemId != null ? { itemId } : {}),
  ...(relatedItemIds?.length ? { relatedItemIds } : {}),
})

const pushUniqueIssue = (issues: TripValidationIssue[], issue: TripValidationIssue) => {
  const key = [
    issue.code,
    issue.severity,
    issue.message,
    issue.itemId || '',
    (issue.relatedItemIds || []).join(','),
  ].join('|')

  if (
    issues.some(
      (entry) =>
        [
          entry.code,
          entry.severity,
          entry.message,
          entry.itemId || '',
          (entry.relatedItemIds || []).join(','),
        ].join('|') === key,
    )
  ) {
    return
  }

  issues.push(issue)
}

export const validateTripItineraryCoherence = (
  input: TripItineraryValidationInput,
): TripItineraryValidationResult => {
  const issues: TripValidationIssue[] = []
  const itemsByPosition = [...input.items].sort((a, b) => a.position - b.position || a.id - b.id)
  const hotelItems = itemsByPosition.filter((item) => item.itemType === 'hotel')
  const carItems = itemsByPosition.filter((item) => item.itemType === 'car')
  const flightItems = itemsByPosition.filter((item) => item.itemType === 'flight')

  for (const item of itemsByPosition) {
    const coarseStart = getItemStartDay(item)
    const coarseEnd = getItemEndDay(item)

    if (hasInvalidDateRange(item)) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'item_date_range_invalid',
          'blocking',
          `${item.title} has an invalid date range.`,
          item.id,
        ),
      )
    }

    if (item.itemType !== 'flight' && (!item.startDate || !item.endDate)) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'item_dates_incomplete',
          'warning',
          `${item.title} is missing dates, so itinerary sequencing is incomplete.`,
          item.id,
        ),
      )
    }

    if (item.itemType === 'flight' && !coarseStart) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'item_dates_incomplete',
          'warning',
          `${item.title} is missing its live flight date, so itinerary sequencing is incomplete.`,
          item.id,
        ),
      )
    }

    if (input.tripStartDate && coarseStart && coarseStart < input.tripStartDate) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'item_before_trip_start',
          'blocking',
          `${item.title} starts before the trip date range.`,
          item.id,
        ),
      )
    }

    if (input.tripEndDate && coarseEnd && coarseEnd > input.tripEndDate) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'item_after_trip_end',
          'blocking',
          `${item.title} ends after the trip date range.`,
          item.id,
        ),
      )
    }
  }

  for (let index = 0; index < hotelItems.length; index += 1) {
    for (let cursor = index + 1; cursor < hotelItems.length; cursor += 1) {
      const a = hotelItems[index]
      const b = hotelItems[cursor]

      if (rangesOverlapExclusive(a.startDate, a.endDate, b.startDate, b.endDate)) {
        pushUniqueIssue(
          issues,
          makeIssue(
            'overlapping_hotels',
            'blocking',
            `${a.title} overlaps with ${b.title}.`,
            a.id,
            [b.id],
          ),
        )
      }
    }
  }

  for (let index = 0; index < carItems.length; index += 1) {
    for (let cursor = index + 1; cursor < carItems.length; cursor += 1) {
      const a = carItems[index]
      const b = carItems[cursor]

      if (rangesOverlapExclusive(a.startDate, a.endDate, b.startDate, b.endDate)) {
        pushUniqueIssue(
          issues,
          makeIssue(
            'overlapping_cars',
            'blocking',
            `${a.title} overlaps with ${b.title}.`,
            a.id,
            [b.id],
          ),
        )
      }
    }
  }

  for (const flight of flightItems) {
    const flightDay = getFlightDay(flight)
    if (!flightDay) continue

    for (const hotel of hotelItems) {
      if (!hotel.startCityId || !flight.startCityId) continue
      if (!isDateInsideStay(flightDay, hotel.startDate, hotel.endDate)) continue
      if (hotel.startCityId === flight.startCityId) continue

      pushUniqueIssue(
        issues,
        makeIssue(
          'flight_hotel_timing_conflict',
          'blocking',
          `${flight.title} departs from ${formatCity(flight.startCityName)} while ${hotel.title} is still active in ${formatCity(hotel.startCityName)}.`,
          flight.id,
          [hotel.id],
        ),
      )
    }
  }

  for (let index = 0; index < itemsByPosition.length - 1; index += 1) {
    const current = itemsByPosition[index]
    const next = itemsByPosition[index + 1]
    const currentEndDay = getItemEndDay(current)
    const nextStartDay = getItemStartDay(next)
    const currentFlightDay = current.itemType === 'flight' ? getFlightDay(current) : null

    if (
      current.itemType === 'flight' &&
      (next.itemType === 'hotel' || next.itemType === 'car') &&
      current.endCityId &&
      next.startCityId &&
      isSameOrNextDay(currentFlightDay, nextStartDay) &&
      current.endCityId !== next.startCityId
    ) {
      pushUniqueIssue(
        issues,
        makeIssue(
          next.itemType === 'hotel'
            ? 'arrival_city_hotel_mismatch'
            : 'arrival_city_car_mismatch',
          'warning',
          `${current.title} arrives in ${formatCity(current.endCityName)}, but ${next.title} starts in ${formatCity(next.startCityName)}.`,
          current.id,
          [next.id],
        ),
      )
    }

    if (
      current.itemType === 'flight' &&
      next.itemType === 'car' &&
      current.endCityId &&
      next.startCityId === current.endCityId &&
      next.startDate &&
      currentFlightDay &&
      next.startDate < currentFlightDay
    ) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'car_pickup_before_arrival',
          'blocking',
          `${next.title} starts before ${current.title} arrives.`,
          next.id,
          [current.id],
        ),
      )
    }

    if (
      current.itemType === 'flight' &&
      next.itemType === 'car' &&
      current.endCityId &&
      next.startCityId === current.endCityId &&
      next.startDate &&
      currentFlightDay &&
      next.startDate === currentFlightDay &&
      current.liveFlightArrivalAt
    ) {
      const arrivalAt = new Date(current.liveFlightArrivalAt)
      const arrivalHour = Number.isNaN(arrivalAt.getTime()) ? null : arrivalAt.getUTCHours()
      if (arrivalHour != null && arrivalHour >= 22) {
        pushUniqueIssue(
          issues,
          makeIssue(
            'tight_same_day_car_pickup',
            'warning',
            `${next.title} starts the same day as a late arrival on ${current.title}.`,
            next.id,
            [current.id],
          ),
        )
      }
    }

    if (
      currentEndDay &&
      nextStartDay &&
      current.endCityId &&
      next.startCityId &&
      current.itemType !== 'flight' &&
      next.itemType !== 'flight' &&
      current.endCityId !== next.startCityId &&
      isSameOrEarlierDay(nextStartDay, currentEndDay)
    ) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'same_day_city_transition',
          'warning',
          `${current.title} ends in ${formatCity(current.endCityName)}, but ${next.title} starts in ${formatCity(next.startCityName)} without a matching travel segment.`,
          current.id,
          [next.id],
        ),
      )
    }
  }

  if (flightItems.length === 1) {
    const flight = flightItems[0]
    const flightDay = getFlightDay(flight)
    const laterItems = itemsByPosition.filter(
      (item) =>
        item.id !== flight.id &&
        item.startCityId != null &&
        flight.endCityId != null &&
        item.startCityId === flight.endCityId &&
        item.startDate != null &&
        flightDay != null &&
        item.startDate >= flightDay,
    )
    const lastTripCity =
      [...itemsByPosition]
        .reverse()
        .find((item) => item.endCityId != null || item.startCityId != null)

    if (
      laterItems.length &&
      flight.startCityId &&
      lastTripCity &&
      (lastTripCity.endCityId || lastTripCity.startCityId) !== flight.startCityId
    ) {
      pushUniqueIssue(
        issues,
        makeIssue(
          'possible_missing_return_flight',
          'warning',
          `${flight.title} looks like an outbound segment without a matching return flight.`,
          flight.id,
        ),
      )
    }
  }

  return { issues }
}
