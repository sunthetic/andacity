export type PriceQuote = {
  currency: string
  amount: number
  base?: number
  daily?: number
  days?: number
  nightly?: number
  nights?: number
  taxes?: number
  fees?: number
}
