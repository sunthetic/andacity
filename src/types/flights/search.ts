export type FlightResult = {
  id: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  departureMinutes: number
  arrivalMinutes: number
  departureWindow: 'morning' | 'afternoon' | 'evening' | 'overnight'
  arrivalWindow: 'morning' | 'afternoon' | 'evening' | 'overnight'
  stops: 0 | 1 | 2
  stopsLabel: string
  duration: string
  price: number
  currency: string
}
