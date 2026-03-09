import { addDays, compareIsoDate, differenceInDays, maxIsoDate, minIsoDate } from '~/lib/trips/date-utils'
import type {
  TripBundlingGap,
  TripBundlingPriority,
  TripItemType,
} from '~/types/trips/trip'

export type TripGapAnalyzerItem = {
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
  flightServiceDate: string | null
  flightItineraryType: 'one-way' | 'round-trip' | null
  carLocationType: 'airport' | 'city' | null
}

export type TripGapAnalyzerInput = {
  tripStartDate: string | null
  tripEndDate: string | null
  items: TripGapAnalyzerItem[]
}

export type TripGapAnalyzerResult = {
  gaps: TripBundlingGap[]
}

type NormalizedAnalyzerItem = TripGapAnalyzerItem & {
  startDay: string | null
  endDay: string | null
}

const getPriorityRank = (priority: TripBundlingPriority) => {
  if (priority === 'high') return 0
  if (priority === 'medium') return 1
  return 2
}

const getFlightDay = (item: TripGapAnalyzerItem) => {
  return item.startDate || item.flightServiceDate || null
}

const getItemStartDay = (item: TripGapAnalyzerItem) => {
  if (item.itemType === 'flight') return getFlightDay(item)
  return item.startDate
}

const getItemEndDay = (item: TripGapAnalyzerItem) => {
  if (item.itemType === 'flight') return getFlightDay(item)
  return item.endDate || item.startDate
}

const isSameOrBefore = (left: string | null, right: string | null) => {
  const order = compareIsoDate(left, right)
  return order != null && order <= 0
}

const isBefore = (left: string | null, right: string | null) => {
  return compareIsoDate(left, right) === -1
}

const isAfter = (left: string | null, right: string | null) => {
  return compareIsoDate(left, right) === 1
}

const rangesOverlapExclusive = (
  startA: string | null,
  endA: string | null,
  startB: string | null,
  endB: string | null,
) => {
  if (!startA || !endA || !startB || !endB) return false
  return isBefore(startA, endB) && isBefore(startB, endA)
}

const compareNormalizedItems = (left: NormalizedAnalyzerItem, right: NormalizedAnalyzerItem) => {
  const leftKey = left.startDay || left.endDay
  const rightKey = right.startDay || right.endDay
  const dateOrder = compareIsoDate(leftKey, rightKey)

  if (dateOrder != null) return dateOrder
  if (leftKey && !rightKey) return -1
  if (!leftKey && rightKey) return 1
  return left.position - right.position || left.id - right.id
}

const compareGaps = (left: TripBundlingGap, right: TripBundlingGap) => {
  const priorityOrder = getPriorityRank(left.priority) - getPriorityRank(right.priority)
  if (priorityOrder !== 0) return priorityOrder

  const dateOrder = compareIsoDate(left.startDate, right.startDate)
  if (dateOrder != null) return dateOrder
  if (left.startDate && !right.startDate) return -1
  if (!left.startDate && right.startDate) return 1
  return left.title.localeCompare(right.title)
}

const buildGapId = (input: {
  gapType: TripBundlingGap['gapType']
  targetItemType: TripItemType
  startDate: string | null
  endDate: string | null
  cityId: number | null
  originCityId: number | null
  destinationCityId: number | null
  relatedItemIds: number[]
}) => {
  return [
    input.gapType,
    input.targetItemType,
    input.startDate || '',
    input.endDate || '',
    input.cityId || '',
    input.originCityId || '',
    input.destinationCityId || '',
    input.relatedItemIds.join(','),
  ].join(':')
}

const resolveCityId = (item: NormalizedAnalyzerItem, direction: 'start' | 'end') => {
  if (direction === 'start') return item.startCityId || item.endCityId || null
  return item.endCityId || item.startCityId || null
}

const resolveCityName = (item: NormalizedAnalyzerItem, direction: 'start' | 'end') => {
  if (direction === 'start') return item.startCityName || item.endCityName || null
  return item.endCityName || item.startCityName || null
}

const createGapPusher = (gaps: TripBundlingGap[]) => {
  const seen = new Set<string>()

  return (gap: Omit<TripBundlingGap, 'id'>) => {
    const id = buildGapId({
      gapType: gap.gapType,
      targetItemType: gap.targetItemType,
      startDate: gap.startDate,
      endDate: gap.endDate,
      cityId: gap.cityId,
      originCityId: gap.originCityId,
      destinationCityId: gap.destinationCityId,
      relatedItemIds: gap.relatedItemIds,
    })

    if (seen.has(id)) return
    seen.add(id)
    gaps.push({ id, ...gap })
  }
}

export const tripGapAnalyzer = (input: TripGapAnalyzerInput): TripGapAnalyzerResult => {
  const normalizedItems = input.items.map<NormalizedAnalyzerItem>((item) => ({
    ...item,
    startDay: getItemStartDay(item),
    endDay: getItemEndDay(item),
  }))
  const chronologicalItems = normalizedItems
    .filter((item) => item.startDay || item.endDay)
    .sort(compareNormalizedItems)
  const hotelItems = normalizedItems.filter(
    (item) => item.itemType === 'hotel' && item.startDate && item.endDate,
  )
  const carItems = normalizedItems.filter(
    (item) => item.itemType === 'car' && item.startDate && item.endDate,
  )
  const flightItems = normalizedItems.filter(
    (item) => item.itemType === 'flight' && item.startDay,
  )
  const tripStartDate =
    input.tripStartDate || minIsoDate(...chronologicalItems.map((item) => item.startDay))
  const tripEndDate =
    input.tripEndDate || maxIsoDate(...chronologicalItems.map((item) => item.endDay))
  const gaps: TripBundlingGap[] = []
  const pushGap = createGapPusher(gaps)

  const firstFlight = [...flightItems].sort(compareNormalizedItems)[0] || null
  const firstTravelDay = firstFlight?.startDay || null
  const expectsReturn =
    firstFlight != null &&
    (flightItems.length === 1 || firstFlight.flightItineraryType === 'round-trip')
  const homeCityId =
    firstFlight?.startCityId ||
    resolveCityId(chronologicalItems[0] || normalizedItems[0], 'start')
  const homeCityName =
    firstFlight?.startCityName ||
    resolveCityName(chronologicalItems[0] || normalizedItems[0], 'start')
  const lastLocatedItem =
    [...chronologicalItems].reverse().find(
      (item) => resolveCityId(item, 'end') != null || resolveCityId(item, 'start') != null,
    ) || null
  const finalCityId =
    (lastLocatedItem ? resolveCityId(lastLocatedItem, 'end') : null) || null
  const finalCityName =
    (lastLocatedItem ? resolveCityName(lastLocatedItem, 'end') : null) || null
  const returnAnchorDate =
    tripEndDate || lastLocatedItem?.endDay || lastLocatedItem?.startDay || null
  const hasReturnFlight =
    Boolean(homeCityId && finalCityId) &&
    flightItems.some((item) => {
      if (item.id === firstFlight?.id) return false
      if (item.startCityId !== finalCityId || item.endCityId !== homeCityId) return false
      if (!item.startDay) return false
      if (!firstTravelDay) return true
      return isSameOrBefore(firstTravelDay, item.startDay)
    })

  if (
    expectsReturn &&
    homeCityId != null &&
    finalCityId != null &&
    homeCityId !== finalCityId &&
    returnAnchorDate &&
    !hasReturnFlight
  ) {
    pushGap({
      gapType: 'missing_return_flight',
      priority: 'high',
      targetItemType: 'flight',
      title: 'Add return flight',
      description: `The trip ends in ${finalCityName || 'another city'}, but nothing returns to ${homeCityName || 'your origin city'}.`,
      startDate: returnAnchorDate,
      endDate: null,
      cityId: finalCityId,
      cityName: finalCityName,
      originCityId: finalCityId,
      originCityName: finalCityName,
      destinationCityId: homeCityId,
      destinationCityName: homeCityName,
      relatedItemIds: [firstFlight?.id, lastLocatedItem?.id].filter(
        (value): value is number => value != null,
      ),
    })
  }

  for (const flight of flightItems) {
    const arrivalDay = flight.startDay
    const arrivalCityId = flight.endCityId
    const arrivalCityName = flight.endCityName

    if (!arrivalDay || arrivalCityId == null) continue

    const hotelsInArrivalCity = hotelItems
      .filter(
        (item) =>
          item.startCityId === arrivalCityId &&
          item.startDate &&
          item.endDate &&
          isAfter(item.endDate, arrivalDay),
      )
      .sort(compareNormalizedItems)

    const nextDeparture = flightItems
      .filter(
        (item) =>
          item.id !== flight.id &&
          item.startCityId === arrivalCityId &&
          item.startDay &&
          isAfter(item.startDay, arrivalDay),
      )
      .sort(compareNormalizedItems)[0]

    const immediateHotel =
      hotelsInArrivalCity.find((item) => isSameOrBefore(item.startDate, addDays(arrivalDay, 1))) ||
      null
    const firstHotel = hotelsInArrivalCity[0] || null
    const lodgingGapEnd = minIsoDate(firstHotel?.startDate, nextDeparture?.startDay, tripEndDate)
    const lodgingGapDays = differenceInDays(arrivalDay, lodgingGapEnd)

    if (!immediateHotel && lodgingGapEnd && lodgingGapDays != null && lodgingGapDays > 0) {
      pushGap({
        gapType: 'missing_lodging',
        priority: 'high',
        targetItemType: 'hotel',
        title: 'Add hotel near arrival airport',
        description: `${flight.title} arrives in ${arrivalCityName || 'your destination'}, but there is no lodging covering the arrival window.`,
        startDate: arrivalDay,
        endDate: lodgingGapEnd,
        cityId: arrivalCityId,
        cityName: arrivalCityName,
        originCityId: null,
        originCityName: null,
        destinationCityId: null,
        destinationCityName: null,
        relatedItemIds: [flight.id, firstHotel?.id, nextDeparture?.id].filter(
          (value): value is number => value != null,
        ),
      })
    }

    if (immediateHotel) {
      const hasAirportPickupCar = carItems.some(
        (item) =>
          item.startCityId === arrivalCityId &&
          item.carLocationType === 'airport' &&
          item.startDate &&
          item.endDate &&
          isSameOrBefore(item.startDate, addDays(arrivalDay, 1)) &&
          isAfter(item.endDate, arrivalDay),
      )

      if (!hasAirportPickupCar) {
        pushGap({
          gapType: 'arrival_ground_transport',
          priority: 'medium',
          targetItemType: 'car',
          title: 'Add ground transport after arrival',
          description: `${flight.title} lands in ${arrivalCityName || 'your destination'}, but there is no airport pickup scheduled for the hotel stay.`,
          startDate: arrivalDay,
          endDate: immediateHotel.endDate,
          cityId: arrivalCityId,
          cityName: arrivalCityName,
          originCityId: null,
          originCityName: null,
          destinationCityId: null,
          destinationCityName: null,
          relatedItemIds: [flight.id, immediateHotel.id],
        })
      }
    }
  }

  for (const hotel of hotelItems) {
    const stayDays = differenceInDays(hotel.startDate, hotel.endDate)
    const hotelCityId = hotel.startCityId || hotel.endCityId
    const hotelCityName = hotel.startCityName || hotel.endCityName

    if (stayDays == null || stayDays < 2 || hotelCityId == null) continue

    const hasCarDuringStay = carItems.some(
      (item) =>
        item.startCityId === hotelCityId &&
        rangesOverlapExclusive(item.startDate, item.endDate, hotel.startDate, hotel.endDate),
    )

    if (hasCarDuringStay) continue

    pushGap({
      gapType: 'missing_car_rental',
      priority: 'low',
      targetItemType: 'car',
      title: 'Add car rental for your stay',
      description: `${hotel.title} spans multiple days in ${hotelCityName || 'your destination'} without a matching rental car.`,
      startDate: hotel.startDate,
      endDate: hotel.endDate,
      cityId: hotelCityId,
      cityName: hotelCityName,
      originCityId: null,
      originCityName: null,
      destinationCityId: null,
      destinationCityName: null,
      relatedItemIds: [hotel.id],
    })
  }

  for (let index = 0; index < chronologicalItems.length - 1; index += 1) {
    const current = chronologicalItems[index]
    const next = chronologicalItems[index + 1]
    const gapStart = current.endDay
    const gapEnd = next.startDay
    const gapDays = differenceInDays(gapStart, gapEnd)

    if (gapDays == null || gapDays <= 0) continue

    const currentCityId = resolveCityId(current, 'end')
    const currentCityName = resolveCityName(current, 'end')
    const nextCityId = resolveCityId(next, 'start')
    const nextCityName = resolveCityName(next, 'start')

    if (currentCityId != null && nextCityId != null && currentCityId === nextCityId) {
      pushGap({
        gapType: gapDays >= 2 ? 'large_idle_gap' : 'date_coverage_gap',
        priority: gapDays >= 2 ? 'medium' : 'low',
        targetItemType: 'hotel',
        title: gapDays >= 2 ? 'Fill idle trip days' : 'Fill missing stay dates',
        description: `${current.title} ends before ${next.title} begins in ${currentCityName || 'the same city'}.`,
        startDate: gapStart,
        endDate: gapEnd,
        cityId: currentCityId,
        cityName: currentCityName,
        originCityId: null,
        originCityName: null,
        destinationCityId: null,
        destinationCityName: null,
        relatedItemIds: [current.id, next.id],
      })
      continue
    }

    if (currentCityId != null && nextCityId != null) {
      pushGap({
        gapType: 'intercity_transfer_gap',
        priority: 'high',
        targetItemType: 'flight',
        title: 'Add connecting flight',
        description: `${current.title} ends in ${currentCityName || 'one city'}, but ${next.title} starts in ${nextCityName || 'another city'} without a travel segment.`,
        startDate: gapStart,
        endDate: gapEnd,
        cityId: currentCityId,
        cityName: currentCityName,
        originCityId: currentCityId,
        originCityName: currentCityName,
        destinationCityId: nextCityId,
        destinationCityName: nextCityName,
        relatedItemIds: [current.id, next.id],
      })
    }
  }

  return {
    gaps: gaps.sort(compareGaps),
  }
}
