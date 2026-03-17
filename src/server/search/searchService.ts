import { mapCarSearchParams, CarSearchParamsError } from '~/lib/providers/car/mapCarSearchParams'
import { mapFlightSearchParams, FlightSearchParamsError } from '~/lib/providers/flight/mapFlightSearchParams'
import { mapHotelSearchParams, HotelSearchParamsError } from '~/lib/providers/hotel/mapHotelSearchParams'
import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import { getProvider, listSearchProviders } from '~/lib/providers/providerRegistry'
import { resolveLocationBySearchSlug } from '~/lib/location/location-repo.server'
import {
  getCachedResults,
  getSearchCacheKey,
  setCachedResults,
  type SearchCacheParams,
} from '~/lib/search/search-cache'
import {
  resolveIncrementalSearchResults,
} from '~/lib/search/incrementalSearch'
import type { CanonicalLocation } from '~/types/location'
import type {
  NormalizedSearchResults,
  SearchParams,
  SearchRequest,
  SearchRequestError,
  SearchRequestErrorCode,
  SearchResultsIncrementalBatch,
  SearchResultsIncrementalMetadata,
} from '~/types/search'
import type { SearchEntity } from '~/types/search-entity'

type SearchServiceDependencies = {
  getProvider?: (type: SearchRequest['type']) => ProviderAdapter | null
  getProviders?: (type: SearchRequest['type']) => ProviderAdapter[]
  resolveLocationBySearchSlug?: (searchSlug: string) => Promise<CanonicalLocation | null>
  getCachedResults?: typeof getCachedResults
  setCachedResults?: typeof setCachedResults
  now?: () => number
}

type FlightProviderRequest = ReturnType<typeof mapFlightSearchParams>
type HotelProviderRequest = ReturnType<typeof mapHotelSearchParams>
type CarProviderRequest = ReturnType<typeof mapCarSearchParams>
type ProviderRequest = FlightProviderRequest | HotelProviderRequest | CarProviderRequest

type SearchExecutionPlan = {
  request: SearchRequest
  searchParams: SearchParams
  providerRequest: ProviderRequest
  cacheParams: SearchCacheParams
  searchKey: string
  providers: ProviderAdapter[]
  providerLabels: string[]
  cachedResults: SearchEntity[] | null
}

export type IncrementalSearchSnapshot = {
  request: SearchRequest
  results: SearchEntity[]
  batches: SearchResultsIncrementalBatch[]
  metadata: SearchResultsIncrementalMetadata
}

type SearchExecutionSession = SearchExecutionPlan & {
  batches: SearchResultsIncrementalBatch[]
  results: SearchEntity[]
  providerLabelsPending: string[]
  providerLabelsCompleted: string[]
  providerFailureCount: number
  fatalError: Error | null
  startedAtMs: number
  updatedAtMs: number
  completedAtMs: number | null
  promise: Promise<void>
}

const INCREMENTAL_SESSION_TTL_MS = 2 * 60 * 1000

const searchExecutionSessions = new Map<string, SearchExecutionSession>()

const defaultDependencies: Required<SearchServiceDependencies> = {
  getProvider,
  getProviders: (type) => listSearchProviders(type),
  resolveLocationBySearchSlug,
  getCachedResults,
  setCachedResults,
  now: () => Date.now(),
}

const resolveSearchServiceDependencies = (
  overrides: SearchServiceDependencies,
): Required<SearchServiceDependencies> => ({
  getProvider: overrides.getProvider ?? defaultDependencies.getProvider,
  getProviders:
    overrides.getProviders ??
    (overrides.getProvider ? (() => []) : defaultDependencies.getProviders),
  resolveLocationBySearchSlug:
    overrides.resolveLocationBySearchSlug ?? defaultDependencies.resolveLocationBySearchSlug,
  getCachedResults: overrides.getCachedResults ?? defaultDependencies.getCachedResults,
  setCachedResults: overrides.setCachedResults ?? defaultDependencies.setCachedResults,
  now: overrides.now ?? defaultDependencies.now,
})

const toSearchParams = async (
  request: SearchRequest,
  dependencies: Required<SearchServiceDependencies>,
): Promise<SearchParams> => {
  if (request.type === 'flight') {
    const [originLocation, destinationLocation] = await Promise.all([
      request.origin ? dependencies.resolveLocationBySearchSlug(request.origin) : Promise.resolve(null),
      request.destination
        ? dependencies.resolveLocationBySearchSlug(request.destination)
        : Promise.resolve(null),
    ])

    return {
      vertical: 'flight',
      origin: request.origin,
      destination: request.destination,
      departDate: request.departDate,
      returnDate: request.returnDate,
      originLocation,
      destinationLocation,
      passengers: 1,
    }
  }

  if (request.type === 'hotel') {
    const destinationLocation = request.city
      ? await dependencies.resolveLocationBySearchSlug(request.city)
      : null

    return {
      vertical: 'hotel',
      destination: request.city,
      destinationLocation,
      checkInDate: request.checkIn,
      checkOutDate: request.checkOut,
      occupancy: 2,
      rooms: 1,
    }
  }

  const airportLocation = request.airport
    ? await dependencies.resolveLocationBySearchSlug(request.airport)
    : null
  const pickupDate = request.pickupDate
  const dropoffDate = request.dropoffDate

  return {
    vertical: 'car',
    pickupLocation: request.airport,
    dropoffLocation: request.airport,
    pickupLocationData: airportLocation,
    dropoffLocationData: airportLocation,
    pickupDate,
    dropoffDate,
    departDate: pickupDate,
    returnDate: dropoffDate,
  }
}

const getErrorCodeFromValidationMessage = (message: string): SearchRequestErrorCode => {
  if (message.includes('date') || message.includes('Date')) {
    return 'INVALID_DATE'
  }

  if (message.includes('could not be mapped')) {
    return 'LOCATION_NOT_FOUND'
  }

  return 'INVALID_LOCATION_CODE'
}

const toExecutionError = (error: unknown) => {
  if (
    error instanceof FlightSearchParamsError ||
    error instanceof HotelSearchParamsError ||
    error instanceof CarSearchParamsError
  ) {
    const code = getErrorCodeFromValidationMessage(error.message)
    const status = code === 'LOCATION_NOT_FOUND' ? 404 : 400
    return new SearchExecutionError(code, error.message, { status })
  }

  return error
}

const validateAndMapRequest = (params: SearchParams): ProviderRequest => {
  try {
    if (params.vertical === 'flight') {
      return mapFlightSearchParams(params)
    }

    if (params.vertical === 'hotel') {
      return mapHotelSearchParams(params)
    }

    return mapCarSearchParams(params)
  } catch (error) {
    throw toExecutionError(error)
  }
}

const buildCacheParams = (
  request: SearchRequest,
  providerRequest: ProviderRequest,
): SearchCacheParams => {
  if (request.type === 'flight') {
    const flightRequest = providerRequest as FlightProviderRequest
    return {
      origin: flightRequest.originIata,
      destination: flightRequest.destinationIata,
      departDate: flightRequest.departDate,
      returnDate: flightRequest.returnDate,
      itineraryType: flightRequest.itineraryType,
      passengers: flightRequest.passengers,
    }
  }

  if (request.type === 'hotel') {
    const hotelRequest = providerRequest as HotelProviderRequest
    return {
      citySlug: request.city || hotelRequest.citySlug,
      checkIn: hotelRequest.checkInDate,
      checkOut: hotelRequest.checkOutDate,
      occupancy: hotelRequest.occupancy,
      rooms: hotelRequest.rooms,
      sort: hotelRequest.sort,
      priceRange: hotelRequest.filters.priceRanges,
      starRating: hotelRequest.filters.starRatings,
      guestRating: hotelRequest.filters.guestRatingMin == null ? [] : [hotelRequest.filters.guestRatingMin * 2],
      amenities: hotelRequest.filters.amenities,
    }
  }

  const carRequest = providerRequest as CarProviderRequest
  return {
    pickupLocation: request.airport || carRequest.citySlug,
    pickupDate: carRequest.pickupDate,
    dropoffDate: carRequest.dropoffDate,
    sort: carRequest.sort,
    vehicleClass: carRequest.filters.vehicleClassKeys,
    pickupType: carRequest.filters.pickupType || 'airport',
    transmission: carRequest.filters.transmission,
    seatsMin: carRequest.filters.seatsMin,
    priceBand: carRequest.filters.priceBand,
  }
}

const dedupeProviders = (providers: ProviderAdapter[]) => {
  const deduped = new Map<string, ProviderAdapter>()

  for (const provider of providers) {
    const key = String(provider.provider || '').trim().toLowerCase()
    if (!key || deduped.has(key)) continue
    deduped.set(key, provider)
  }

  return Array.from(deduped.values())
}

const resolveProviders = (
  request: SearchRequest,
  dependencies: Required<SearchServiceDependencies>,
) => {
  const listedProviders = dependencies.getProviders(request.type) || []
  if (listedProviders.length > 0) {
    return dedupeProviders(listedProviders)
  }

  const fallbackProvider = dependencies.getProvider(request.type)

  return dedupeProviders([
    ...(fallbackProvider ? [fallbackProvider] : []),
  ])
}

const getProviderLabels = (providers: ProviderAdapter[]) =>
  providers.map((provider) => provider.provider)

const toIsoTimestamp = (value: number) => new Date(value).toISOString()

const getSessionStatus = (
  completedAtMs: number | null,
  results: SearchEntity[],
) => {
  if (completedAtMs != null) return 'complete' as const
  if (results.length > 0) return 'partial' as const
  return 'loading' as const
}

const buildIncrementalMetadata = (
  session: Pick<
    SearchExecutionSession,
    | 'request'
    | 'searchKey'
    | 'results'
    | 'batches'
    | 'providerLabelsCompleted'
    | 'providerLabelsPending'
    | 'startedAtMs'
    | 'completedAtMs'
  >,
  now: number,
  cacheHit: boolean,
): SearchResultsIncrementalMetadata => ({
  vertical: session.request.type,
  totalResults: session.results.length,
  providersQueried: session.providerLabelsCompleted.slice(),
  cacheHit,
  searchTimeMs: Math.max(
    0,
    Math.round((session.completedAtMs ?? now) - session.startedAtMs),
  ),
  searchKey: session.searchKey,
  status: getSessionStatus(session.completedAtMs, session.results),
  cursor: session.batches.length,
  batchCount: session.batches.length,
  providersCompleted: session.providerLabelsCompleted.slice(),
  providersPending: session.providerLabelsPending.slice(),
})

const pruneExpiredSessions = (now: number) => {
  for (const [searchKey, session] of searchExecutionSessions.entries()) {
    const ageMs = now - session.updatedAtMs
    if (ageMs > INCREMENTAL_SESSION_TTL_MS) {
      searchExecutionSessions.delete(searchKey)
    }
  }
}

const filterNewResults = (
  existingResults: readonly SearchEntity[],
  nextResults: readonly SearchEntity[],
) => {
  const seenInventoryIds = new Set(existingResults.map((result) => result.inventoryId))
  const batchSeenInventoryIds = new Set<string>()

  return nextResults.filter((result) => {
    if (seenInventoryIds.has(result.inventoryId)) return false
    if (batchSeenInventoryIds.has(result.inventoryId)) return false
    batchSeenInventoryIds.add(result.inventoryId)
    return true
  })
}

const applyProviderResults = (
  session: SearchExecutionSession,
  provider: ProviderAdapter,
  providerIndex: number,
  results: SearchEntity[],
  now: number,
) => {
  const providerLabel = provider.provider
  session.providerLabelsPending = session.providerLabelsPending.filter((label) => label !== providerLabel)

  if (!session.providerLabelsCompleted.includes(providerLabel)) {
    session.providerLabelsCompleted = [...session.providerLabelsCompleted, providerLabel]
  }

  const uniqueResults = filterNewResults(session.results, results)
  if (uniqueResults.length > 0) {
    session.batches = [
      ...session.batches,
      {
        cursor: session.batches.length + 1,
        provider: providerLabel,
        providerIndex,
        receivedAt: toIsoTimestamp(now),
        totalResults: 0,
        results: uniqueResults,
      },
    ]
    session.results = resolveIncrementalSearchResults(session.batches)
    const lastBatch = session.batches[session.batches.length - 1]
    if (lastBatch) {
      lastBatch.totalResults = session.results.length
    }
  }

  session.updatedAtMs = now
}

const finalizeSession = (
  session: SearchExecutionSession,
  dependencies: Required<SearchServiceDependencies>,
  now: number,
) => {
  session.results = resolveIncrementalSearchResults(session.batches)
  session.updatedAtMs = now
  session.completedAtMs = now

  if (session.results.length === 0 && session.providerFailureCount >= session.providers.length) {
    session.fatalError = session.fatalError || new Error('Search execution failed.')
  }

  dependencies.setCachedResults(
    session.request.type,
    session.searchKey,
    session.cacheParams,
    session.results,
  )
}

const createExecutionSession = (
  plan: SearchExecutionPlan,
  dependencies: Required<SearchServiceDependencies>,
) => {
  const startedAtMs = dependencies.now()
  const session: SearchExecutionSession = {
    ...plan,
    batches: [],
    results: [],
    providerLabelsPending: plan.providerLabels.slice(),
    providerLabelsCompleted: [],
    providerFailureCount: 0,
    fatalError: null,
    startedAtMs,
    updatedAtMs: startedAtMs,
    completedAtMs: null,
    promise: Promise.resolve(),
  }

  session.promise = Promise.allSettled(
    session.providers.map(async (provider, providerIndex) => {
      let results: SearchEntity[] = []

      try {
        results = await provider.search(session.searchParams)
      } catch (error) {
        session.providerFailureCount += 1
        if (error instanceof Error) {
          session.fatalError = session.fatalError || error
        }
        results = []
      }

      applyProviderResults(session, provider, providerIndex, results, dependencies.now())
    }),
  ).then(() => {
    finalizeSession(session, dependencies, dependencies.now())
  })

  return session
}

const ensureExecutionSession = (
  plan: SearchExecutionPlan,
  dependencies: Required<SearchServiceDependencies>,
) => {
  const now = dependencies.now()
  pruneExpiredSessions(now)

  const existing = searchExecutionSessions.get(plan.searchKey)
  if (existing) {
    const completedSessionWithoutCache =
      existing.completedAtMs != null && plan.cachedResults == null

    if (!completedSessionWithoutCache) {
      return existing
    }

    searchExecutionSessions.delete(plan.searchKey)
  }

  const session = createExecutionSession(plan, dependencies)
  searchExecutionSessions.set(plan.searchKey, session)
  return session
}

const buildCachedIncrementalSnapshot = (
  plan: SearchExecutionPlan,
  cachedResults: SearchEntity[],
  now: number,
): IncrementalSearchSnapshot => {
  const batch =
    cachedResults.length > 0
      ? [
          {
            cursor: 1,
            provider: 'cache',
            providerIndex: 0,
            receivedAt: toIsoTimestamp(now),
            totalResults: cachedResults.length,
            results: cachedResults,
          } satisfies SearchResultsIncrementalBatch,
        ]
      : []

  return {
    request: plan.request,
    results: cachedResults,
    batches: batch,
    metadata: {
      vertical: plan.request.type,
      totalResults: cachedResults.length,
      providersQueried: [],
      cacheHit: true,
      searchTimeMs: 0,
      searchKey: plan.searchKey,
      status: 'complete',
      cursor: batch.length,
      batchCount: batch.length,
      providersCompleted: [],
      providersPending: [],
    },
  }
}

const buildSessionSnapshot = (
  session: SearchExecutionSession,
  cursor: number,
  now: number,
): IncrementalSearchSnapshot => ({
  request: session.request,
  results: session.results.slice(),
  batches: session.batches.filter((batch) => batch.cursor > cursor),
  metadata: buildIncrementalMetadata(session, now, false),
})

const prepareSearchExecution = async (
  request: SearchRequest,
  dependencies: Required<SearchServiceDependencies>,
): Promise<SearchExecutionPlan> => {
  const searchParams = await toSearchParams(request, dependencies)
  const providerRequest = validateAndMapRequest(searchParams)
  const cacheParams = buildCacheParams(request, providerRequest)
  const searchKey = getSearchCacheKey(request.type, cacheParams)
  const providers = resolveProviders(request, dependencies)
  const providerLabels = getProviderLabels(providers)
  const cachedResults =
    dependencies.getCachedResults<SearchEntity[]>(searchKey)

  return {
    request,
    searchParams,
    providerRequest,
    cacheParams,
    searchKey,
    providers,
    providerLabels,
    cachedResults,
  }
}

export class SearchExecutionError extends Error {
  code: SearchRequestErrorCode
  field?: string
  status: number
  value?: string | null

  constructor(
    code: SearchRequestErrorCode,
    message: string,
    options: {
      field?: string
      value?: string | null
      status?: number
    } = {},
  ) {
    super(message)
    this.name = 'SearchExecutionError'
    this.code = code
    this.field = options.field
    this.value = options.value
    this.status =
      options.status ??
      (code === 'LOCATION_NOT_FOUND' ? 404 : code === 'PROVIDER_UNAVAILABLE' ? 503 : 400)
  }

  toJSON(): SearchRequestError {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
      ...(this.value !== undefined ? { value: this.value } : {}),
    }
  }
}

export const isSearchExecutionError = (value: unknown): value is SearchExecutionError =>
  value instanceof SearchExecutionError

export const executeSearchRequest = async (
  request: SearchRequest,
  overrides: SearchServiceDependencies = {},
): Promise<NormalizedSearchResults> => {
  const dependencies = resolveSearchServiceDependencies(overrides)
  const plan = await prepareSearchExecution(request, dependencies)

  if (plan.cachedResults) {
    return {
      request,
      searchKey: plan.searchKey,
      cacheHit: true,
      providers: [],
      results: plan.cachedResults,
    }
  }

  if (!plan.providers.length) {
    throw new SearchExecutionError(
      'PROVIDER_UNAVAILABLE',
      `No provider adapter is registered for ${request.type} search.`,
      {
        field: 'type',
        value: request.type,
        status: 503,
      },
    )
  }

  const session = ensureExecutionSession(plan, dependencies)
  await session.promise

  if (session.fatalError && session.results.length === 0) {
    throw session.fatalError
  }

  return {
    request,
    searchKey: plan.searchKey,
    cacheHit: false,
    providers: plan.providerLabels,
    results: session.results.slice(),
  }
}

export const getIncrementalSearchSnapshot = async (
  request: SearchRequest,
  cursor = 0,
  overrides: SearchServiceDependencies = {},
): Promise<IncrementalSearchSnapshot> => {
  const dependencies = resolveSearchServiceDependencies(overrides)
  const plan = await prepareSearchExecution(request, dependencies)
  const now = dependencies.now()
  pruneExpiredSessions(now)

  const existingSession = searchExecutionSessions.get(plan.searchKey)
  if (existingSession) {
    if (existingSession.fatalError && existingSession.completedAtMs != null && existingSession.results.length === 0) {
      throw existingSession.fatalError
    }

    return buildSessionSnapshot(existingSession, Math.max(0, Math.round(cursor || 0)), now)
  }

  if (plan.cachedResults) {
    return buildCachedIncrementalSnapshot(plan, plan.cachedResults, now)
  }

  if (!plan.providers.length) {
    throw new SearchExecutionError(
      'PROVIDER_UNAVAILABLE',
      `No provider adapter is registered for ${request.type} search.`,
      {
        field: 'type',
        value: request.type,
        status: 503,
      },
    )
  }

  const session = ensureExecutionSession(plan, dependencies)
  if (session.fatalError && session.completedAtMs != null && session.results.length === 0) {
    throw session.fatalError
  }
  return buildSessionSnapshot(session, Math.max(0, Math.round(cursor || 0)), now)
}

export const clearIncrementalSearchSessions = () => {
  searchExecutionSessions.clear()
}
