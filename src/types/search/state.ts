export type SearchState = {
  query: string
  location?: {
    city?: string
    lat?: number
    lng?: number
  }
  dates?: {
    checkIn?: string
    checkOut?: string
  }
  filters?: Record<string, unknown>
  sort?: string
  page?: number
}
