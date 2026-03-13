import type { SearchEntityPrice, SearchVertical } from '~/types/search-entity'

export type BookableEntity<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  inventoryId: string
  vertical: SearchVertical
  price: SearchEntityPrice
  payload: TPayload
  provider: string | null
  title: string
  subtitle: string | null
  href: string | null
}
