import type {
  TripAppliedChange,
  TripDetails,
  TripEditPreview,
  TripItemCandidate,
  TripItemReplacementOption,
  TripListItem,
  TripRollbackDraft,
} from '~/types/trips/trip'

export class TripApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'TripApiError'
  }
}

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const method = String(init?.method || 'GET').toUpperCase()
  const response = await fetch(input, {
    ...init,
    cache: init?.cache ?? (method === 'GET' || method === 'HEAD' ? 'no-store' : undefined),
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const payload = await response
    .json()
    .catch(() => ({ error: `Request failed with status ${response.status}.` }))

  if (!response.ok) {
    const message = String(payload?.error || `Request failed with status ${response.status}.`)
    throw new TripApiError(response.status, message, payload?.code)
  }

  return payload as T
}

export const listTripsApi = async (): Promise<TripListItem[]> => {
  const payload = await requestJson<{ trips: TripListItem[] }>('/api/trips', {
    method: 'GET',
  })
  return payload.trips || []
}

export const createTripApi = async (input: {
  name?: string
  status?: string
}): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(input || {}),
  })
  return payload.trip
}

export const getTripDetailsApi = async (tripId: number): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(`/api/trips/${tripId}`, {
    method: 'GET',
  })
  return payload.trip
}

export const addItemToTripApi = async (
  tripId: number,
  candidate: TripItemCandidate,
): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(`/api/trips/${tripId}/items`, {
    method: 'POST',
    body: JSON.stringify(candidate),
  })
  return payload.trip
}

export const removeTripItemApi = async (tripId: number, itemId: number): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(
    `/api/trips/${tripId}/items/${itemId}`,
    {
      method: 'DELETE',
    },
  )
  return payload.trip
}

export const updateTripItemApi = async (
  tripId: number,
  itemId: number,
  input: {
    locked?: boolean
    candidate?: TripItemCandidate
  },
): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(
    `/api/trips/${tripId}/items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input || {}),
    },
  )
  return payload.trip
}

export const reorderTripItemsApi = async (
  tripId: number,
  orderedItemIds: number[],
): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(
    `/api/trips/${tripId}/items/reorder`,
    {
      method: 'POST',
      body: JSON.stringify({ orderedItemIds }),
    },
  )
  return payload.trip
}

export const previewTripItemEditApi = async (
  tripId: number,
  itemId: number,
  input:
    | {
        actionType: 'reorder'
        orderedItemIds: number[]
      }
    | {
        actionType: 'remove'
      }
    | {
        actionType: 'replace'
        candidate: TripItemCandidate
      },
): Promise<TripEditPreview> => {
  const payload = await requestJson<{ preview: TripEditPreview }>(
    `/api/trips/${tripId}/items/${itemId}/preview`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return payload.preview
}

export const applyTripItemEditApi = async (
  tripId: number,
  itemId: number,
  input:
    | {
        actionType: 'reorder'
        orderedItemIds: number[]
      }
    | {
        actionType: 'remove'
      }
    | {
        actionType: 'replace'
        candidate: TripItemCandidate
      },
): Promise<{
  trip: TripDetails
  appliedChange: TripAppliedChange | null
}> => {
  return requestJson<{ trip: TripDetails; appliedChange: TripAppliedChange | null }>(
    `/api/trips/${tripId}/items/${itemId}/apply`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export const listTripItemReplacementOptionsApi = async (
  tripId: number,
  itemId: number,
): Promise<TripItemReplacementOption[]> => {
  const payload = await requestJson<{ options: TripItemReplacementOption[] }>(
    `/api/trips/${tripId}/items/${itemId}/replace-options`,
    {
      method: 'GET',
    },
  )
  return payload.options || []
}

export const updateTripMetadataApi = async (
  tripId: number,
  input: {
    name?: string
    status?: string
    notes?: string | null
    startDate?: string | null
    endDate?: string | null
    dateSource?: 'auto' | 'manual'
    metadata?: Record<string, unknown>
  },
): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(`/api/trips/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify(input || {}),
  })
  return payload.trip
}

export const restoreTripRollbackDraftApi = async (
  tripId: number,
  draft: TripRollbackDraft,
): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(`/api/trips/${tripId}/restore`, {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  return payload.trip
}

export const revalidateTripApi = async (tripId: number): Promise<TripDetails> => {
  const payload = await requestJson<{ trip: TripDetails }>(`/api/trips/${tripId}/revalidate`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return payload.trip
}
